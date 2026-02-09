const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no backend.");
}

const BASE_URL = SUPABASE_URL.replace(/\/$/, "");
const REST_URL = `${BASE_URL}/rest/v1`;

const defaultHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

type SupabaseRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

function buildQuery(params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return "";
  return (
    "?" +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")
  );
}

const parseResponse = async (response: Response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export async function supabaseRequest<T = unknown>(path: string, options: SupabaseRequestOptions = {}) {
  const query = buildQuery(options.params);
  const headers = {
    ...defaultHeaders,
    ...options.headers,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(`${REST_URL}/${path}${query}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const parsed = await parseResponse(response);
  if (!response.ok) {
    const message = parsed && typeof parsed === "object" && "message" in parsed ? (parsed as any).message : response.statusText;
    throw new Error(typeof message === "string" ? message : "Erro na requisição Supabase.");
  }

  return parsed as T;
}
