import { notFound } from "next/navigation";
import { devMailbox } from "@/lib/mail";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

/** Development-only inbox: shows every email the app sent (OTP codes included). Disabled in production. */
export default function MailboxPage() {
  if (env.isProd || !env.mailDevMailbox) notFound();
  const mails = devMailbox();
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-bold">Dev mailbox</h1>
      <p className="text-sm text-gray-600">Mail mode: <b>{env.mailMode}</b>. {env.mailMode === "harakumo" ? "Messages were really sent via Harakumo Mail — this is a copy." : "Messages were logged only (not delivered)."} Refresh to update.</p>
      {mails.length === 0 ? <p className="mt-6 text-sm text-gray-500">No emails yet.</p> : (
        <ul className="mt-6 space-y-3">{mails.map((m) => (
          <li key={m.id} className="card p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{m.subject}</b><span className="text-xs text-gray-500">{formatDate(m.at)} · to {m.to} · {m.provider} · {m.status}{m.error ? ` (${m.error})` : ""}</span></div><pre className="mt-2 whitespace-pre-wrap font-sans text-gray-700">{m.text}</pre></li>
        ))}</ul>
      )}
    </div>
  );
}
