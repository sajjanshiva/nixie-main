// Sends emails via Brevo REST API when configured, or SMTP fallback.
const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;
if (env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

function getSender() {
  if (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) {
    return { name: env.BREVO_SENDER_NAME || env.EMAIL_FROM_NAME, address: env.BREVO_SENDER_EMAIL };
  }
  return { name: env.EMAIL_FROM_NAME, address: env.SMTP_USER || "noreply@thenixie.in" };
}

/** Shown read-only in the admin "Send invoice" popup. */
function fromLabel() {
  const from = getSender();
  return `${from.name} <${from.address}>`;
}

async function sendViaBrevo({ to, subject, html, text }) {
  const sender = getSender();
  const payload = {
    sender: { name: sender.name, email: sender.address },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {}),
    ...(env.CONTACT_EMAIL ? { replyTo: { email: env.CONTACT_EMAIL } } : {}),
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[brevo] API error ${res.status}:`, errorBody);
    throw new Error(`Failed to send email via Brevo: ${res.statusText}`);
  }
}

async function sendEmail({ to, subject, html, text }) {
  if (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) {
    return await sendViaBrevo({ to, subject, html, text });
  }

  if (transporter) {
    const from = getSender();
    return await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      replyTo: env.CONTACT_EMAIL,
    });
  }

  console.warn("[email] Neither Brevo nor SMTP configured. Email not sent.");
}

module.exports = { sendEmail, fromLabel };

