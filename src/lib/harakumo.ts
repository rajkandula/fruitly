/**
 * Minimal typed client for the Harakumo REST API.
 *
 * The official `@harakumo/sdk` package is not published on npm (as of Aug 2026),
 * so this client talks plain HTTP. Every endpoint/response shape below was
 * verified against the live API (https://harakumo.com/api) during setup.
 */
import { env } from "./env";

export class HarakumoError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "HarakumoError";
    this.status = status;
    this.body = body;
  }
}

export interface HarakumoClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

// ---- Response types (observed) ----
export interface HkProject {
  id: number; name: string; slug: string; framework: string; status: string;
  region: string; repo_url: string; repo_branch: string; org_id: number; created_at: string;
}
export interface HkDatabase {
  id: number; project_id: number; name: string; engine: string; version: string;
  status: string; provider: string; cf_database_id?: string; created_at: string;
}
export interface HkQueryMeta {
  changes?: number; last_row_id?: number; rows_read?: number; rows_written?: number;
  duration?: number; changed_db?: boolean;
}
export interface HkQueryResult<Row = Record<string, unknown>> { results: Row[]; meta: HkQueryMeta }
export interface HkBucket {
  id: number; project_id: number; name: string; gcp_bucket_name: string; size_bytes: number;
  file_count: number; status: string; provider: string;
}
export interface HkPresign { url: string; key: string; expiresIn: number }
export interface HkStorageObject { key: string; size: number; lastModified: string }
export interface HkPaymentsAccount { id: number; [k: string]: unknown }
export interface HkPaymentSession {
  id?: number | string; url?: string; checkout_url?: string; status?: string;
  amount_cents?: number; amountCents?: number; description?: string; [k: string]: unknown;
}
export interface HkAuthPool {
  id: number; project_id: number; providers: string; mfa_required: number; jwt_issuer: string;
  client_id: string; client_secret_last4: string; user_count: number; status: string;
}
export interface HkAuthPoolUser {
  id: number; pool_id: number; email: string; name: string; provider: string; last_login_at: string; created_at: string;
}
export interface HkMailMessage {
  id: number; org_id: number; to_email: string; from_email: string; subject: string;
  status: string; provider: string; message_id: string; error: string; created_at: string;
}
export interface HkAiResponse {
  model: string; output: string; latencyMs: number; tokensIn: number; tokensOut: number; cost: number;
}
export interface HkEnvVar { id: number; project_id: number; key: string; value: string; target: string }
export interface HkDeployment { id: number; [k: string]: unknown }

export class Harakumo {
  private apiKey: string;
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(opts: HarakumoClientOptions = {}) {
    this.apiKey = opts.apiKey ?? env.harakumoApiKey;
    this.baseUrl = (opts.baseUrl ?? env.harakumoBaseUrl).replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
    if (!this.apiKey) throw new HarakumoError("HARAKUMO_API_KEY is not configured", 0);
  }

  get configured() { return Boolean(this.apiKey); }

  async request<T>(method: string, path: string, body?: unknown, init?: { timeoutMs?: number }): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 30_000);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          Accept: "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
        cache: "no-store",
      });
      const text = await res.text();
      let data: unknown = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!res.ok) {
        const msg = (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string")
          ? (data as { error: string }).error
          : `Harakumo ${method} ${path} failed with ${res.status}`;
        throw new HarakumoError(msg, res.status, data);
      }
      if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
        throw new HarakumoError(String((data as { error: unknown }).error), res.status, data);
      }
      return data as T;
    } finally {
      clearTimeout(t);
    }
  }

  // ---- Projects ----
  projects = {
    list: () => this.request<{ projects: HkProject[]; org: { id: number; name: string; role: string } }>("GET", "/api/projects"),
    create: (input: { name: string; framework?: string; description?: string }) =>
      this.request<{ project: HkProject }>("POST", "/api/projects", input),
    get: (id: number | string) => this.request<{ project: HkProject } & Record<string, unknown>>("GET", `/api/projects/${id}`),
  };

  // ---- Databases (Edge SQLite) ----
  databases = {
    list: (projectId: number | string) => this.request<{ databases: HkDatabase[] }>("GET", `/api/projects/${projectId}/databases`),
    create: (projectId: number | string, input: { name: string; engine?: "sqlite" | "postgres" | "mysql" | "redis" }) =>
      this.request<{ database: HkDatabase }>("POST", `/api/projects/${projectId}/databases`, { engine: "sqlite", ...input }),
    /** Execute SQL. `?` placeholders are bound from `params` (verified on the live API). Multi-statement SQL is accepted. */
    query: <Row = Record<string, unknown>>(databaseId: number | string, sql: string, params: unknown[] = []) =>
      this.request<HkQueryResult<Row>>("POST", `/api/databases/${databaseId}`, params.length ? { sql, params } : { sql }, { timeoutMs: 60_000 }),
  };

  // ---- Storage (presigned URLs) ----
  storage = {
    list: (projectId: number | string) => this.request<{ buckets: HkBucket[] }>("GET", `/api/projects/${projectId}/storage`),
    create: (projectId: number | string, input: { name: string }) =>
      this.request<{ bucket: HkBucket }>("POST", `/api/projects/${projectId}/storage`, input),
    get: (bucketId: number | string) => this.request<{ bucket: HkBucket; objects: HkStorageObject[] }>("GET", `/api/storage/${bucketId}`),
    presign: (bucketId: number | string, input: { key: string; method: "put" | "get"; contentType?: string }) =>
      this.request<HkPresign>("POST", `/api/storage/${bucketId}`, input),
  };

  // ---- Payments (Stripe Connect) ----
  payments = {
    enable: (projectId: number | string) =>
      this.request<{ account: HkPaymentsAccount; onboardingUrl?: string }>("POST", `/api/projects/${projectId}/payments`, {}),
    status: (projectId: number | string) =>
      this.request<{ account: HkPaymentsAccount | null; sessions: HkPaymentSession[] }>("GET", `/api/projects/${projectId}/payments`),
    createSession: (accountId: number | string, input: { amountCents: number; description: string; [k: string]: unknown }) =>
      this.request<{ session: HkPaymentSession }>("POST", `/api/payments/${accountId}`, input),
  };

  // ---- Auth pools (used here only as a user directory / token issuer mirror) ----
  auth = {
    enable: (projectId: number | string) => this.request<{ pool: HkAuthPool; clientSecret: string }>("POST", `/api/projects/${projectId}/auth`, {}),
    status: (projectId: number | string) => this.request<{ pool: HkAuthPool | null; users: HkAuthPoolUser[] }>("GET", `/api/projects/${projectId}/auth`),
    /** Upserts a user by email and returns a JWT. NOTE: the live API does not verify `password` — never rely on it for authentication. */
    signup: (poolId: number | string, input: { email: string; password?: string; name?: string }) =>
      this.request<{ user: HkAuthPoolUser; token: string; newUser: boolean }>("POST", `/api/auth-pools/${poolId}`, input),
  };

  // ---- Mail ----
  mail = {
    send: (input: { to: string; subject: string; text: string; html?: string; from?: string; replyTo?: string }) =>
      this.request<{ message: HkMailMessage }>("POST", "/api/mail/send", input),
  };

  // ---- AI gateway ----
  ai = {
    generate: (input: { model?: string; prompt: string; [k: string]: unknown }) =>
      this.request<HkAiResponse>("POST", "/api/ai/playground", { model: "auto", ...input }, { timeoutMs: 90_000 }),
  };

  // ---- Env vars / Deployments ----
  envVars = {
    list: (projectId: number | string) => this.request<{ env: HkEnvVar[] }>("GET", `/api/projects/${projectId}/env`),
    /** Upserts by key (verified: POST with an existing key updates the value). */
    set: (projectId: number | string, key: string, value: string, target = "production") =>
      this.request<{ env: HkEnvVar[] }>("POST", `/api/projects/${projectId}/env`, { key, value, target }),
  };
  deployments = {
    list: (projectId: number | string) => this.request<{ deployments: HkDeployment[] }>("GET", `/api/projects/${projectId}/deployments`),
    connectRepo: (projectId: number | string, input: { repoUrl: string; branch?: string }) =>
      this.request<Record<string, unknown>>("PUT", `/api/projects/${projectId}/repo`, input),
    push: (projectId: number | string, branch = "main") =>
      this.request<Record<string, unknown>>("POST", `/api/projects/${projectId}/repo`, { branch }, { timeoutMs: 120_000 }),
  };
}

let singleton: Harakumo | null = null;
/** Shared client; returns null when no API key is configured (local dev fallback). */
export function harakumo(): Harakumo | null {
  if (!env.harakumoApiKey) return null;
  if (!singleton) singleton = new Harakumo();
  return singleton;
}
export function requireHarakumo(): Harakumo {
  const hk = harakumo();
  if (!hk) throw new HarakumoError("HARAKUMO_API_KEY is not configured", 0);
  return hk;
}
