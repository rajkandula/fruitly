import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentAuth } from "./auth/session";
import { HarakumoError } from "./harakumo";
import type { User } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); this.name = "ApiError"; }
}

export function json<T>(data: T, init?: ResponseInit) { return NextResponse.json(data, init); }
export function fail(status: number, error: string, details?: unknown) { return NextResponse.json({ error, details }, { status }); }

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw new ApiError(400, "Invalid JSON body"); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError(422, firstZodMessage(parsed.error), parsed.error.flatten());
  return parsed.data;
}
export function parseQuery<T>(url: string, schema: ZodType<T>): T {
  const obj = Object.fromEntries(new URL(url).searchParams.entries());
  const parsed = schema.safeParse(obj);
  if (!parsed.success) throw new ApiError(422, firstZodMessage(parsed.error), parsed.error.flatten());
  return parsed.data;
}
function firstZodMessage(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}

export async function requireUser(): Promise<User> {
  const auth = await getCurrentAuth();
  if (!auth) throw new ApiError(401, "Please sign in to continue.");
  return auth.user;
}
export async function requireVerifiedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.email_verified) throw new ApiError(403, "Please verify your email address first.");
  return user;
}
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ApiError(403, "Admin access required.");
  return user;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
/** CSRF defence-in-depth: browsers always send Origin on cross-site POSTs; server-to-server calls (no Origin) pass. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

/** Wraps a route handler so thrown ApiError / Zod / Harakumo errors become clean JSON responses. */
export function handler<Ctx = unknown>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      if (!SAFE_METHODS.has(req.method) && !sameOrigin(req)) return fail(403, "Cross-site request blocked.");
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.message, err.details);
      if (err instanceof ZodError) return fail(422, firstZodMessage(err));
      if (err instanceof HarakumoError) {
        console.error("[api] Harakumo error:", err.status, err.message);
        return fail(502, `Upstream service error: ${err.message}`);
      }
      console.error("[api] Unhandled error:", err);
      return fail(500, "Something went wrong. Please try again.");
    }
  };
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim();
}
