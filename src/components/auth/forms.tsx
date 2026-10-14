"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data } as { ok: boolean; status: number; data: Record<string, unknown> & { error?: string } };
}
function Err({ msg }: { msg: string | null }) { return msg ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p> : null; }
function Ok({ msg }: { msg: string | null }) { return msg ? <p className="rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-800">{msg}</p> : null; }
function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) { return <button disabled={busy} className="btn-primary w-full py-3">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{children}</button>; }

function PasswordInput({ value, onChange, placeholder, autoComplete }: { value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} className="input pr-10" required minLength={8} maxLength={128} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await post("/api/auth/signup", { name, email, password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Sign up failed"); return; }
    if (r.data.requiresVerification) router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    else router.push(`/login?email=${encodeURIComponent(email)}&msg=exists`);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Err msg={error} />
      <div><label className="label">Full name</label><input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Appleseed" /></div>
      <div><label className="label">Email</label><input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></div>
      <div><label className="label">Password</label><PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters, letters + numbers" /></div>
      <Submit busy={busy}>Create account</Submit>
      <p className="text-center text-xs text-gray-500">We&apos;ll email you a 6-digit code to verify your address.</p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter(); const sp = useSearchParams();
  const next = sp.get("next") || "/account";
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState(sp.get("email") ?? ""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(sp.get("msg") === "exists" ? "You already have an account — sign in below." : sp.get("msg") === "reset" ? "Password updated. Please sign in." : null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await post("/api/auth/login", { email, password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Sign in failed"); return; }
    if (r.data.requiresVerification) { router.push(`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`); return; }
    router.push(next); router.refresh();
  };
  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await post("/api/auth/otp/request", { email, purpose: "login" });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Could not send code"); return; }
    router.push(`/verify-email?email=${encodeURIComponent(email)}&purpose=login&next=${encodeURIComponent(next)}`);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-leaf-50 p-1 text-sm font-medium">
        <button type="button" onClick={() => setMode("password")} className={`rounded-lg py-1.5 ${mode === "password" ? "bg-white shadow-soft" : "text-gray-600"}`}>Password</button>
        <button type="button" onClick={() => setMode("otp")} className={`rounded-lg py-1.5 ${mode === "otp" ? "bg-white shadow-soft" : "text-gray-600"}`}>Email me a code</button>
      </div>
      <Ok msg={info} /><Err msg={error} />
      {mode === "password" ? (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Email</label><input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div><div className="flex items-center justify-between"><label className="label">Password</label><Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="link text-xs">Forgot password?</Link></div><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></div>
          <Submit busy={busy}>Sign in</Submit>
        </form>
      ) : (
        <form onSubmit={requestOtp} className="space-y-4">
          <div><label className="label">Email</label><input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <Submit busy={busy}><Mail className="h-4 w-4" />Send sign-in code</Submit>
          <p className="text-center text-xs text-gray-500">We&apos;ll email a 6-digit one-time code. No password needed.</p>
        </form>
      )}
    </div>
  );
}

/** Handles verify_email (after signup) and login (passwordless) codes. */
export function OtpForm() {
  const router = useRouter(); const sp = useSearchParams();
  const email = sp.get("email") ?? ""; const purpose = (sp.get("purpose") === "login" ? "login" : "verify_email") as "login" | "verify_email";
  const next = sp.get("next") || "/account";
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (code.length !== 6) return; setBusy(true); setError(null);
    const r = await post(purpose === "login" ? "/api/auth/otp/login" : "/api/auth/verify-email", { email, code });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Invalid code"); setCode(""); return; }
    router.push(next); router.refresh();
  };
  const resend = async () => {
    setBusy(true); setError(null); setInfo(null);
    const r = await post("/api/auth/otp/request", { email, purpose });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Could not resend"); return; }
    if (r.data.alreadyVerified) { router.push(`/login?email=${encodeURIComponent(email)}`); return; }
    setInfo("A new code is on its way."); setCooldown(45);
  };
  useEffect(() => { if (code.length === 6) void submit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [code]);
  if (!email) return <p className="text-sm text-gray-600">Missing email. <Link href="/signup" className="link">Sign up</Link> or <Link href="/login" className="link">sign in</Link>.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <Ok msg={info} /><Err msg={error} />
      <p className="text-sm text-gray-600">We sent a 6-digit code to <b className="text-ink">{email}</b>. {purpose === "verify_email" ? "Enter it to activate your account." : "Enter it to sign in."}</p>
      <input ref={inputRef} inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" className="input text-center font-mono text-3xl tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" aria-label="Verification code" />
      <Submit busy={busy}>{purpose === "login" ? "Sign in" : "Verify email"}</Submit>
      <div className="flex items-center justify-between text-sm"><button type="button" onClick={resend} disabled={busy || cooldown > 0} className="link disabled:opacity-50">{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button><Link href="/login" className="text-gray-500 hover:text-ink">Use a different email</Link></div>
      {process.env.NODE_ENV !== "production" && <p className="text-center text-xs text-gray-400">Dev tip: codes are also visible at <Link href="/dev/mailbox" className="underline">/dev/mailbox</Link></p>}
    </form>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter(); const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") ?? ""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await post("/api/auth/otp/request", { email, purpose: "reset_password" });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Could not send code"); return; }
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Err msg={error} />
      <div><label className="label">Email</label><input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
      <Submit busy={busy}>Send reset code</Submit>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter(); const sp = useSearchParams();
  const email = sp.get("email") ?? "";
  const [code, setCode] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await post("/api/auth/password/reset", { email, code, password });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Reset failed"); return; }
    router.push("/account"); router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Err msg={error} />
      <p className="text-sm text-gray-600">Enter the code we emailed to <b className="text-ink">{email}</b> and choose a new password.</p>
      <div><label className="label">6-digit code</label><input inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="input text-center font-mono text-2xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
      <div><label className="label">New password</label><PasswordInput value={password} onChange={setPassword} autoComplete="new-password" /></div>
      <Submit busy={busy}>Set new password</Submit>
      <p className="text-center text-xs text-gray-500">Didn&apos;t get it? <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="link">Request a new code</Link></p>
    </form>
  );
}
