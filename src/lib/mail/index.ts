import { env } from "../env";
import { harakumo } from "../harakumo";

export interface MailMessage { to: string; subject: string; text: string; html?: string }
export interface SentMail extends MailMessage { id: string; at: string; provider: string; status: string; error?: string }

// In-memory dev mailbox (non-production): lets you read OTP codes at /dev/mailbox without a real inbox.
const g = globalThis as unknown as { __fruitlyMailbox?: SentMail[] };
function mailbox(): SentMail[] { return (g.__fruitlyMailbox ??= []); }
export function devMailbox(): SentMail[] { return [...mailbox()].reverse(); }
export function clearDevMailbox() { mailbox().length = 0; }

/**
 * Sends an email through Harakumo Mail (from no-reply@harakumo.com).
 * In dev mode (no API key, or MAIL_MODE=dev) the message is logged and stored in the dev mailbox instead.
 * Never throws — email failures are logged and returned so business flows keep working.
 */
export async function sendMail(msg: MailMessage): Promise<SentMail> {
  const record: SentMail = { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString(), provider: "dev", status: "queued" };
  const hk = harakumo();
  if (env.mailMode === "harakumo" && hk) {
    try {
      const { message } = await hk.mail.send({ to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
      record.provider = `harakumo/${message.provider}`;
      record.status = message.status;
      record.id = String(message.id);
      if (message.error) record.error = message.error;
    } catch (err) {
      record.status = "failed";
      record.error = err instanceof Error ? err.message : String(err);
      console.error("[mail] Harakumo send failed:", record.error);
    }
  } else {
    record.status = "dev-logged";
    console.log(`\n[mail:dev] To: ${msg.to}\n[mail:dev] Subject: ${msg.subject}\n${msg.text}\n`);
  }
  if (env.mailDevMailbox) {
    mailbox().push(record);
    if (mailbox().length > 200) mailbox().splice(0, mailbox().length - 200);
  }
  return record;
}
