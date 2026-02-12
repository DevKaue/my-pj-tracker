import { normalizeDocument, isDocumentIdentifier } from "./validators";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidos.",
  );
}

const BASE_URL = SUPABASE_URL.replace(/\/$/, "");
const SESSION_STORAGE_KEY = "my-pj-tracker.supabase-session";
const SESSION_EVENT_TYPE = "supabase-auth-change";

export interface SupabaseUser {
  id: string;
  email: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
}

export type AuthErrorCode = "email_not_confirmed" | string;

type MessageKeys = "message" | "msg" | "error_description" | "error";

const parseJsonSafe = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const normalizeArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const getErrorMessageFromBody = (body: Record<string, unknown>): string | undefined => {
  const keys: MessageKeys[] = ["message", "msg", "error_description", "error"];
  for (const key of keys) {
    const candidate = body[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
};

const getAuthErrorCodeFromBody = (body: Record<string, unknown>): AuthErrorCode | undefined => {
  const value = body["error_code"];
  return typeof value === "string" ? (value as AuthErrorCode) : undefined;
};

const toSupabaseUser = (value: unknown): SupabaseUser => {
  if (typeof value !== "object" || value === null) {
    return { id: "", email: null };
  }
  const record = value as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    email: typeof record.email === "string" ? record.email : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    user_metadata: normalizeRecord(record.user_metadata),
    app_metadata: normalizeRecord(record.app_metadata),
    ...record,
  };
};

const buildSessionFromBody = (body: Record<string, unknown>): SupabaseSession => {
  const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 0;
  return {
    access_token: typeof body.access_token === "string" ? body.access_token : "",
    refresh_token: typeof body.refresh_token === "string" ? body.refresh_token : "",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: typeof body.token_type === "string" ? body.token_type : "bearer",
    user: toSupabaseUser(body.user),
  };
};

const parseRetryAfterSeconds = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const sessionEventTarget = new EventTarget();

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const hasLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function persistSession(session: SupabaseSession | null) {
  if (!hasLocalStorage()) return;
  const storage = window.localStorage;
  if (!session) {
    storage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSessionStorage() {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function emitSession(session: SupabaseSession | null) {
  sessionEventTarget.dispatchEvent(
    new CustomEvent<SupabaseSession | null>(SESSION_EVENT_TYPE, {
      detail: session,
    }),
  );
}

export class SupabaseAuthError extends Error {
  code?: AuthErrorCode;
  retryAfterSeconds?: number;

  constructor(message: string, code?: AuthErrorCode, retryAfterSeconds?: number) {
    super(message);
    this.name = "SupabaseAuthError";
    this.code = code;
    if (typeof retryAfterSeconds === "number" && !Number.isNaN(retryAfterSeconds)) {
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
}

export async function resendEmailConfirmation(email: string) {
  const response = await fetch(`${BASE_URL}/auth/v1/resend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify({
      type: "signup",
      email: email.trim().toLowerCase(),
    }),
  });

  const raw = await response.text();
  const parsed = raw ? parseJsonSafe(raw) : {};
  const body = normalizeRecord(parsed);

  if (!response.ok) {
    const message = getErrorMessageFromBody(body) ?? response.statusText;
    throw new SupabaseAuthError(
      message ?? "Não foi possível reenviar a confirmação.",
    );
  }
}

export function onAuthStateChange(
  callback: (session: SupabaseSession | null) => void,
) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SupabaseSession | null>;
    callback(customEvent.detail);
  };
  sessionEventTarget.addEventListener(SESSION_EVENT_TYPE, handler);
  return () =>
    sessionEventTarget.removeEventListener(SESSION_EVENT_TYPE, handler);
}

export function getStoredSession(): SupabaseSession | null {
  if (!hasLocalStorage()) return null;
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      expires_at:
        parsed.expires_at ??
        Math.floor(Date.now() / 1000) + (parsed.expires_in || 0),
    } satisfies SupabaseSession;
  } catch {
    clearSessionStorage();
    return null;
  }
}

async function restFetch(path: string, init?: RequestInit) {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...baseHeaders,
    ...init?.headers,
  };
  return fetch(url, { ...init, headers });
}

export async function getEmailByDocument(document: string) {
  if (!isDocumentIdentifier(document)) {
    throw new Error("Informe um CPF ou CNPJ válido (somente números).");
  }

  const digits = normalizeDocument(document);

  const encoded = encodeURIComponent(digits);
  const response = await restFetch(
    `/rest/v1/profiles?select=email&document=eq.${encoded}`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = getErrorMessageFromBody(normalizeRecord(body)) ?? response.statusText;
    throw new Error(
      message ?? "Não foi possível buscar o documento.",
    );
  }

  const body = await response.json().catch(() => []);
  const rows = normalizeArray(body);
  const firstRow = rows.length > 0 ? normalizeRecord(rows[0]) : {};
  const email = typeof firstRow.email === "string" ? firstRow.email : undefined;
  if (!email) {
    throw new Error("Nenhum cadastro encontrado para este CPF ou CNPJ.");
  }

  return email;
}

export async function signUpWithDocument(
  email: string,
  password: string,
  document: string,
) {
  if (!isDocumentIdentifier(document)) {
    throw new Error("Informe um CPF ou CNPJ válido (somente números).");
  }

  const digits = normalizeDocument(document);
  const response = await fetch(`${BASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          document: digits,
        },
      },
    }),
  });

  const rawBody = await response.json().catch(() => ({}));
  const body = normalizeRecord(rawBody);

  if (!response.ok) {
    const message =
      getErrorMessageFromBody(body) ??
      response.statusText;
    const errorCode = getAuthErrorCodeFromBody(body);
    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get("retry-after"));
    throw new SupabaseAuthError(
      typeof message === "string" ? message : "Não foi possível criar o usuário.",
      errorCode,
      retryAfterSeconds,
    );
  }

  const session = buildSessionFromBody(body);

  // When email confirmation is enabled, Supabase returns an empty access_token.
  // In that case, do NOT persist an invalid session.
  const needsConfirmation = !session.access_token;

  if (!needsConfirmation) {
    await ensureProfileRow(session, digits, email.trim().toLowerCase());
    persistSession(session);
    emitSession(session);
  }

  return needsConfirmation ? null : session;
}

export async function signInWithPassword(email: string, password: string) {
  const url = `${BASE_URL}/auth/v1/token?grant_type=password`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders, // apikey + Authorization: Bearer ANON
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  // Supabase às vezes volta texto/HTML em erros, então é bom ser resiliente:
  const raw = await response.text();
  const body = normalizeRecord(raw ? parseJsonSafe(raw) : {});

  if (!response.ok) {
    const errorCode = getAuthErrorCodeFromBody(body);

    const message = getErrorMessageFromBody(body) ?? response.statusText;

    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get("retry-after"));

    if (errorCode === "email_not_confirmed") {
      throw new SupabaseAuthError(
        "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou reenvie a confirmação.",
        errorCode,
      );
    }

    throw new SupabaseAuthError(
      typeof message === "string" ? message : "Não foi possível autenticar.",
      errorCode,
      retryAfterSeconds,
    );
  }

  const session = buildSessionFromBody(body);

  persistSession(session);
  emitSession(session);
  return session;
}

async function ensureProfileRow(
  session: SupabaseSession,
  normalizedDocument: string,
  normalizedEmail: string,
) {
  const payload = {
    user_id: session.user.id,
    email: normalizedEmail,
    document: normalizedDocument,
  };

  const response = await fetch(`${BASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    return;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = getErrorMessageFromBody(normalizeRecord(body)) ?? response.statusText;
    throw new Error(
      message ?? "Não foi possível gravar o perfil.",
    );
  }
}

export async function signOut() {
  const session = getStoredSession();
  if (session?.access_token) {
    await fetch(`${BASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => {
      // Silencia falhas de logout remoto
    });
  }
  clearSessionStorage();
  emitSession(null);
}

export function getAuthHeaders(session?: SupabaseSession | null) {
  const token = session?.access_token ?? SUPABASE_ANON_KEY;
  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}
