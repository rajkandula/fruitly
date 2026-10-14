import { env } from "../env";
import { formatMoney } from "../utils";
import type { Order, OrderItem } from "../types";

function esc(s: string | number | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function layout(title: string, bodyHtml: string, preheader = ""): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f6f7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2a1f;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e9df;">
<tr><td style="background:#166534;padding:20px 28px;color:#fff;font-size:20px;font-weight:700;letter-spacing:.2px;">${esc(env.appName)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.55;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#fafbf7;color:#6b7280;font-size:12px;line-height:1.5;">You're receiving this because of activity on your ${esc(env.appName)} account. If this wasn't you, you can safely ignore this email.<br><a href="${esc(env.appUrl)}" style="color:#166534">${esc(env.appUrl)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function codeBlock(code: string): string {
  return `<div style="margin:20px 0;text-align:center"><span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;background:#f0fdf4;color:#166534;border:1px dashed #86efac;border-radius:12px;padding:14px 22px;font-family:ui-monospace,Menlo,monospace">${esc(code)}</span></div>`;
}
function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${esc(label)}</a></p>`;
}

export function verifyEmailTemplate(name: string, code: string) {
  const ttl = env.otpTtlMinutes;
  return {
    subject: `${code} is your ${env.appName} verification code`,
    text: `Hi ${name},\n\nYour ${env.appName} verification code is: ${code}\nIt expires in ${ttl} minutes.\n\nEnter it at ${env.appUrl}/verify-email to activate your account.`,
    html: layout("Verify your email", `<h2 style="margin:0 0 8px">Welcome, ${esc(name)}</h2><p>Use this code to verify your email address and activate your account:</p>${codeBlock(code)}<p style="color:#6b7280">This code expires in ${ttl} minutes.</p>${button(`${env.appUrl}/verify-email`, "Verify my email")}`, `Your code is ${code}`),
  };
}

export function loginOtpTemplate(name: string, code: string) {
  return {
    subject: `${code} is your ${env.appName} sign-in code`,
    text: `Hi ${name},\n\nYour one-time sign-in code is: ${code}\nIt expires in ${env.otpTtlMinutes} minutes.\n\nIf you did not request this, ignore this email.`,
    html: layout("Your sign-in code", `<h2 style="margin:0 0 8px">Sign in to ${esc(env.appName)}</h2><p>Hi ${esc(name)}, here is your one-time sign-in code:</p>${codeBlock(code)}<p style="color:#6b7280">This code expires in ${env.otpTtlMinutes} minutes. If you didn't request it, you can ignore this email.</p>`, `Your code is ${code}`),
  };
}

export function resetPasswordTemplate(name: string, code: string) {
  return {
    subject: `${code} is your ${env.appName} password reset code`,
    text: `Hi ${name},\n\nUse this code to reset your password: ${code}\nIt expires in ${env.otpTtlMinutes} minutes.\n\nReset at ${env.appUrl}/reset-password`,
    html: layout("Reset your password", `<h2 style="margin:0 0 8px">Reset your password</h2><p>Hi ${esc(name)}, we received a request to reset your password. Use this code:</p>${codeBlock(code)}<p style="color:#6b7280">This code expires in ${env.otpTtlMinutes} minutes.</p>${button(`${env.appUrl}/reset-password`, "Reset password")}`, `Your code is ${code}`),
  };
}

export function welcomeTemplate(name: string) {
  return {
    subject: `Welcome to ${env.appName}`,
    text: `Hi ${name},\n\nYour account is verified and ready. Fresh fruit, delivered.\n\nStart shopping: ${env.appUrl}/shop\nUse code WELCOME10 for 10% off your first order.`,
    html: layout("Welcome", `<h2 style="margin:0 0 8px">You're all set, ${esc(name)}</h2><p>Your email is verified and your ${esc(env.appName)} account is active.</p><p>Use code <b>WELCOME10</b> for 10% off your first order.</p>${button(`${env.appUrl}/shop`, "Start shopping")}`),
  };
}

function itemsTable(items: OrderItem[], currency: string): string {
  const rows = items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0e9">${esc(i.name)} <span style="color:#6b7280">× ${i.quantity} ${esc(i.unit)}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eef0e9">${formatMoney(i.line_total_cents, currency)}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px">${rows}</table>`;
}
function totals(o: Order): string {
  const c = o.currency;
  const line = (l: string, v: string, bold = false) => `<tr><td style="padding:4px 0;color:${bold ? "#1f2a1f" : "#6b7280"};font-weight:${bold ? 700 : 400}">${l}</td><td align="right" style="padding:4px 0;font-weight:${bold ? 700 : 400}">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin-top:10px">
  ${line("Subtotal", formatMoney(o.subtotal_cents, c))}
  ${o.discount_cents ? line(`Discount${o.coupon_code ? ` (${esc(o.coupon_code)})` : ""}`, "−" + formatMoney(o.discount_cents, c)) : ""}
  ${line("Shipping", o.shipping_cents ? formatMoney(o.shipping_cents, c) : "Free")}
  ${o.tax_cents ? line("Tax", formatMoney(o.tax_cents, c)) : ""}
  ${line("Total", formatMoney(o.total_cents, c), true)}</table>`;
}
function address(o: Order): string {
  if (o.fulfillment_method === "pickup") return [o.shipping_name, "Pickup at " + o.shipping_line1, o.shipping_phone].filter(Boolean).map(esc).join("<br>");
  return [o.shipping_name, o.shipping_line1, o.shipping_line2, `${o.shipping_city}${o.shipping_state ? ", " + o.shipping_state : ""} ${o.shipping_postal_code}`, o.shipping_country, o.shipping_phone].filter(Boolean).map(esc).join("<br>");
}
function whenLine(o: Order): string {
  if (!o.delivery_slot) return "";
  const label = o.delivery_slot.replace(/_/g, " ");
  return `<p style="margin:12px 0 0"><b>${o.fulfillment_method === "pickup" ? "Pickup" : "Delivery"} window:</b> ${esc(label)}</p>`;
}

export function orderConfirmationTemplate(o: Order, items: OrderItem[]) {
  const pay = o.payment_method === "cod" ? (o.fulfillment_method === "pickup" ? "Cash on pickup" : "Cash on delivery") : (o.payment_status === "paid" ? "Paid by card" : "Card payment pending");
  const url = `${env.appUrl}/account/orders/${o.id}`;
  return {
    subject: `Order ${o.order_number} confirmed — ${env.appName}`,
    text: `Thanks for your order ${o.order_number}!\n\n${items.map((i) => `- ${i.name} × ${i.quantity} ${i.unit}: ${formatMoney(i.line_total_cents, o.currency)}`).join("\n")}\n\nTotal: ${formatMoney(o.total_cents, o.currency)}\nPayment: ${pay}\n\nTrack it: ${url}`,
    html: layout(`Order ${o.order_number}`, `<h2 style="margin:0 0 8px">Thank you for your order</h2><p>Order <b>${esc(o.order_number)}</b> is ${esc(o.status)}. We'll email you when it ships.</p>${itemsTable(items, o.currency)}${totals(o)}<p style="margin-top:16px"><b>Payment:</b> ${esc(pay)}<br><b>${o.fulfillment_method === "pickup" ? "Pickup" : "Deliver to"}:</b><br>${address(o)}</p>${whenLine(o)}${button(url, "View order")}`),
  };
}

export function orderStatusTemplate(o: Order, note?: string | null) {
  const labels: Record<string, string> = { confirmed: "confirmed", processing: "being prepared", shipped: "on its way", delivered: "delivered", cancelled: "cancelled" };
  const url = `${env.appUrl}/account/orders/${o.id}`;
  return {
    subject: `Order ${o.order_number} is ${labels[o.status] ?? o.status} — ${env.appName}`,
    text: `Your order ${o.order_number} is now ${labels[o.status] ?? o.status}.${note ? `\n\n${note}` : ""}\n\nView: ${url}`,
    html: layout(`Order update`, `<h2 style="margin:0 0 8px">Order ${esc(o.order_number)} is ${esc(labels[o.status] ?? o.status)}</h2>${note ? `<p>${esc(note)}</p>` : ""}<p>Total: <b>${formatMoney(o.total_cents, o.currency)}</b></p>${button(url, "View order")}`),
  };
}

export function adminNewOrderTemplate(o: Order, items: OrderItem[]) {
  return {
    subject: `[${env.appName}] New order ${o.order_number} — ${formatMoney(o.total_cents, o.currency)}`,
    text: `New order ${o.order_number} from ${o.email}\n${items.map((i) => `- ${i.name} x ${i.quantity}`).join("\n")}\nTotal ${formatMoney(o.total_cents, o.currency)} (${o.payment_method}, ${o.payment_status})\n${env.appUrl}/admin/orders/${o.id}`,
    html: layout("New order", `<h2 style="margin:0 0 8px">New order ${esc(o.order_number)}</h2><p>From ${esc(o.email)} · ${esc(o.payment_method)} · ${esc(o.payment_status)}</p>${itemsTable(items, o.currency)}${totals(o)}${button(`${env.appUrl}/admin/orders/${o.id}`, "Open in admin")}`),
  };
}
