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

  constructor(message: string, code?: AuthErrorCode) {
    super(message);
    this.name = "SupabaseAuthError";
    this.code = code;
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
  const body = raw
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      })()
    : {};

  if (!response.ok) {
    const msg =
      (body as any)?.msg ||
      (body as any)?.error_description ||
      (body as any)?.error ||
      response.statusText;
    throw new SupabaseAuthError(
      typeof msg === "string"
        ? msg
        : "Não foi possível reenviar a confirmação.",
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
    const message = (body as any)?.message || response.statusText;
    throw new Error(
      typeof message === "string"
        ? message
        : "Não foi possível buscar o documento.",
    );
  }

  const body = await response.json();
  if (!Array.isArray(body) || body.length === 0 || !body[0]?.email) {
    throw new Error("Nenhum cadastro encontrado para este CPF ou CNPJ.");
  }

  return body[0].email as string;
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

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (body as any)?.error_description ||
      (body as any)?.error ||
      response.statusText;
    throw new Error(
      typeof message === "string"
        ? message
        : "Não foi possível criar o usuário.",
    );
  }

  const session: SupabaseSession = {
    access_token: (body as any).access_token,
    refresh_token: (body as any).refresh_token,
    expires_in: (body as any).expires_in,
    expires_at: Math.floor(Date.now() / 1000) + (body as any).expires_in,
    token_type: (body as any).token_type,
    user: (body as any).user,
  };

  await ensureProfileRow(session, digits, email.trim().toLowerCase());

  persistSession(session);
  emitSession(session);
  return session;
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
  const body = raw
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      })()
    : {};

  if (!response.ok) {
    const errorCode = (body as any)?.error_code as AuthErrorCode | undefined;

    const message =
      (body as any)?.error_description ||
      (body as any)?.msg ||
      (body as any)?.error ||
      response.statusText;

    if (errorCode === "email_not_confirmed") {
      throw new SupabaseAuthError(
        "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou reenvie a confirmação.",
        errorCode,
      );
    }

    throw new SupabaseAuthError(
      typeof message === "string" ? message : "Não foi possível autenticar.",
      errorCode,
    );
  }

  const session: SupabaseSession = {
    access_token: (body as any).access_token,
    refresh_token: (body as any).refresh_token,
    expires_in: (body as any).expires_in,
    expires_at: Math.floor(Date.now() / 1000) + (body as any).expires_in,
    token_type: (body as any).token_type,
    user: (body as any).user,
  };

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
    const message = (body as any)?.message || response.statusText;
    throw new Error(
      typeof message === "string"
        ? message
        : "Não foi possível gravar o perfil.",
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
