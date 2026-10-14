import { randomBytes, randomInt } from "node:crypto";

export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format((cents ?? 0) / 100);
}

export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function randomId(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomOtp(digits = 6): string {
  let s = "";
  for (let i = 0; i < digits; i++) s += String(randomInt(0, 10));
  return s;
}

export function orderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = randomInt(0, 36 ** 3).toString(36).toUpperCase().padStart(3, "0");
  return `FR-${ts}${rnd}`;
}

export function nowIso(): string { return new Date().toISOString(); }
export function plusMinutes(m: number): string { return new Date(Date.now() + m * 60_000).toISOString(); }
export function plusDays(d: number): string { return new Date(Date.now() + d * 86_400_000).toISOString(); }

export function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }

export function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return email;
  const head = u.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, u.length - 2))}@${d}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}
