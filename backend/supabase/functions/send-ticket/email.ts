// backend/supabase/functions/send-ticket/email.ts
// Sends the ticket email. Uses Resend when RESEND_API_KEY is set,
// otherwise Gmail SMTP (app password). Fails loudly if neither is configured.

import nodemailer from "npm:nodemailer@6.9.16";
import { Buffer } from "node:buffer";
import { QR_CID } from "./template.ts";

export interface TicketEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  png: Uint8Array;
  /** Prevents duplicate emails if the same registration is processed twice. */
  idempotencyKey?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ?? "QRoll Call <onboarding@resend.dev>";
const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

export function emailProvider(): "resend" | "gmail" | "none" {
  if (RESEND_API_KEY) return "resend";
  if (GMAIL_USER && GMAIL_APP_PASSWORD) return "gmail";
  return "none";
}

async function sendViaResend(msg: TicketEmail): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (msg.idempotencyKey) headers["Idempotency-Key"] = msg.idempotencyKey;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      attachments: [
        {
          filename: "qr-ticket.png",
          content: Buffer.from(msg.png).toString("base64"),
          content_id: QR_CID,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

async function sendViaGmail(msg: TicketEmail): Promise<void> {
  // Gmail can only send as the authenticated account, so reuse just the
  // display name from EMAIL_FROM.
  const displayName = EMAIL_FROM.match(/^\s*"?([^"<]+?)"?\s*</)?.[1] ?? "QRoll Call";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    connectionTimeout: 15_000,
    socketTimeout: 20_000,
  });

  await transporter.sendMail({
    from: { name: displayName, address: GMAIL_USER! },
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    attachments: [
      {
        filename: "qr-ticket.png",
        content: Buffer.from(msg.png),
        cid: QR_CID,
        contentType: "image/png",
      },
    ],
  });
}

export async function sendTicketEmail(msg: TicketEmail): Promise<void> {
  switch (emailProvider()) {
    case "resend":
      return await sendViaResend(msg);
    case "gmail":
      return await sendViaGmail(msg);
    default:
      throw new Error(
        "No email provider configured. Set RESEND_API_KEY, or GMAIL_USER and GMAIL_APP_PASSWORD.",
      );
  }
}