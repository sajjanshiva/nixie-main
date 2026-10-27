// Email HTML. EVERY value that comes from a user or the database goes through esc().
const env = require("../config/env");
const { escapeHtml: esc } = require("../lib/escapeHtml");
const { formatRupees } = require("../lib/money");

const COLORS = {
  teal: "#17666b",
  tealLight: "#279da4",
  bg: "#f0fffe",
  text: "#000000",
  muted: "#3d5553",
  border: "#cfe9e7",
  yellow: "#ffc43a",
};

function layout({ preheader = "", body }) {
  const phone = env.CONTACT_PHONE ? ` · Call us: ${esc(env.CONTACT_PHONE)}` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:Helvetica,Arial,sans-serif;color:${COLORS.text};">
<span style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${COLORS.border};border-radius:16px;">
<tr><td style="padding:28px 28px 8px;font-size:24px;letter-spacing:6px;font-weight:300;">NIXIE</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${COLORS.border};font-size:12px;line-height:1.6;color:${COLORS.muted};">
Questions? Write to <a href="mailto:${esc(env.CONTACT_EMAIL)}" style="color:${COLORS.teal};">${esc(env.CONTACT_EMAIL)}</a>${phone}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${COLORS.teal};border-radius:10px;">
<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">${esc(label)}</a>
</td></tr></table>`;
}

// ---------------------------------------------------------------------------

function signupOtp({ code, minutes }) {
  return {
    subject: `${code} is your Nixie verification code`,
    html: layout({
      preheader: `Your code is ${code}`,
      body: `<p>Use this code to verify your email and finish creating your Nixie account:</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:18px 0;">${esc(code)}</p>
<p style="color:${COLORS.muted};">The code is valid for ${minutes} minutes. If you didn't try to sign up, you can ignore this email.</p>`,
    }),
    text: `Your Nixie verification code is ${code}. It is valid for ${minutes} minutes.`,
  };
}

function signupAccountExists({ loginUrl, resetUrl }) {
  return {
    subject: "You already have a Nixie account",
    html: layout({
      body: `<p>Someone (hopefully you) tried to sign up with this email, but you already have a Nixie account.</p>
${button(loginUrl, "Log in")}
<p>Forgot your password? <a href="${esc(resetUrl)}" style="color:${COLORS.teal};">Reset it here</a>.</p>
<p style="color:${COLORS.muted};">If this wasn't you, you can ignore this email.</p>`,
    }),
    text: `You already have a Nixie account. Log in: ${loginUrl} — Forgot password: ${resetUrl}`,
  };
}

function passwordReset({ link, minutes, isAdmin }) {
  return {
    subject: isAdmin ? "Reset your Nixie admin password" : "Reset your Nixie password",
    html: layout({
      body: `<p>We received a request to reset your ${isAdmin ? "admin " : ""}password.</p>
${button(link, "Reset password")}
<p style="color:${COLORS.muted};">This link works once and expires in ${minutes} minutes. If you didn't ask for this, you can ignore this email.</p>`,
    }),
    text: `Reset your password (valid ${minutes} minutes, one-time): ${link}`,
  };
}

function itemsTable({ invoice, items }) {
  const rows = items
    .map(
      (it) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};">${esc(it.name)} × ${it.quantity}</td>
<td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};text-align:right;white-space:nowrap;">${formatRupees(it.base_paise)}</td>
</tr>`
    )
    .join("");

  const line = (label, value, bold = false) =>
    `<tr><td style="padding:6px 0;${bold ? "font-weight:bold;font-size:16px;" : `color:${COLORS.muted};`}">${label}</td>
<td style="padding:6px 0;text-align:right;white-space:nowrap;${bold ? "font-weight:bold;font-size:16px;" : ""}">${value}</td></tr>`;

  let summary = line("Subtotal", formatRupees(invoice.subtotal_paise));
  if (invoice.discount_paise > 0) {
    const reason = invoice.discount_reason ? ` (${esc(invoice.discount_reason)})` : "";
    summary += line(`Discount${reason}`, "−" + formatRupees(invoice.discount_paise));
  }
  summary += line("GST", formatRupees(invoice.gst_paise));
  if (invoice.shipping_name) {
    summary += line(
      esc(invoice.shipping_name),
      invoice.shipping_paise > 0 ? formatRupees(invoice.shipping_paise) : "Free"
    );
  }
  summary += line("Total (incl. taxes)", formatRupees(invoice.total_paise), true);
  if (invoice.paid_paise > 0) {
    summary += line("Paid", formatRupees(invoice.paid_paise));
    summary += line("Balance", formatRupees(invoice.total_paise - invoice.paid_paise), true);
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px;">
${rows}
${summary}
</table>`;
}

function invoice({ invoice: inv, items, label, message, payUrl }) {
  const due = inv.total_paise - inv.paid_paise;
  const payLabel = inv.paid_paise > 0 ? `Pay balance ${formatRupees(due)}` : `Pay ${formatRupees(due)}`;
  const note = message
    ? `<p style="white-space:pre-line;">${esc(message)}</p>`
    : `<p>Hi ${esc(inv.customer_name)}, here is your invoice from Nixie.</p>`;
  return {
    html: layout({
      preheader: `Invoice ${label} — ${formatRupees(due)} due`,
      body: `<p style="font-size:13px;color:${COLORS.muted};margin:0 0 12px;">Invoice ${esc(label)}</p>
${note}
${button(payUrl, payLabel)}
${itemsTable({ invoice: inv, items })}
<p style="font-size:13px;color:${COLORS.muted};margin-top:18px;">You can pay in full or pay half now and the rest after delivery.<br>
Button not working? Open this link: <a href="${esc(payUrl)}" style="color:${COLORS.teal};word-break:break-all;">${esc(payUrl)}</a></p>`,
    }),
    text: `Invoice ${label} from Nixie. Amount due: ${formatRupees(due)}. Pay here: ${payUrl}`,
  };
}

function paymentConfirmation({ invoice: inv, label, amountPaise, payUrl }) {
  const balance = inv.total_paise - inv.paid_paise;
  const balanceHtml =
    balance > 0
      ? `<p>Balance remaining: <strong>${formatRupees(balance)}</strong>. You can pay it anytime from the same link.</p>
${button(payUrl, `Pay balance ${formatRupees(balance)}`)}`
      : `<p>Your invoice is now <strong>fully paid</strong>. Thank you!</p>`;
  return {
    subject: `Payment received — Invoice ${label}`,
    html: layout({
      preheader: `We received ${formatRupees(amountPaise)}`,
      body: `<p>Hi ${esc(inv.billing_name || inv.customer_name)},</p>
<p>We've received your payment of <strong>${formatRupees(amountPaise)}</strong> for invoice <strong>${esc(label)}</strong>.</p>
<p>Total: ${formatRupees(inv.total_paise)} · Paid so far: ${formatRupees(inv.paid_paise)}</p>
${balanceHtml}`,
    }),
    text: `We received ${formatRupees(amountPaise)} for invoice ${label}. ${
      balance > 0 ? `Balance: ${formatRupees(balance)}. Pay: ${payUrl}` : "Fully paid. Thank you!"
    }`,
  };
}

module.exports = { signupOtp, signupAccountExists, passwordReset, invoice, paymentConfirmation };
