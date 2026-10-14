"use client";
import { useState } from "react";
export function NewsletterForm() {
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("busy");
    const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setState(res.ok ? "done" : "error");
  };
  if (state === "done") return <p className="mt-4 text-sm font-medium text-leaf-800">Thanks — you're on the list! 🍒</p>;
  return (
    <form onSubmit={submit} className="mt-4 flex max-w-sm gap-2">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" aria-label="Email for newsletter" />
      <button className="btn-primary whitespace-nowrap" disabled={state === "busy"}>Get deals</button>
      {state === "error" && <span className="text-xs text-red-600">Try again</span>}
    </form>
  );
}
