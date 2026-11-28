// backend/supabase/functions/send-ticket/index.ts
// Owner: Role 3 (QR Generation + Email Automation).
// Fired by the Database Webhook on INSERT into public.attendees
// (migrations/20261117000006_send_ticket_webhook.sql).
//   1. Authenticates the call with the shared x-webhook-secret header
//   2. Generates a QR image that encodes ONLY the random qr_token (never the email)
//   3. Uploads it to the "qr-codes" bucket as <qr_token>.png and sets qr_image_path
//   4. Emails the ticket with the QR embedded, then sets email_sent_at
//
// Manual resend (dev/organizer tool): POST { "resend": true, "id": "<uuid>" }
// with the same secret header.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import QRCode from "npm:qrcode@1.5.4";
import { Buffer } from "node:buffer";
import { sendTicketEmail } from "./email.ts";
import { buildHtml, buildSubject, buildText } from "./template.ts";

// ---- Config -----------------------------------------------------------------
// Column names must match docs/CONTRACTS.md. Change them here only.
const COL = {
  id: "id",
  name: "full_name",
  email: "email",
  organization: "organization",
  token: "qr_token",
  imagePath: "qr_image_path",
  emailSentAt: "email_sent_at",
} as const;
const TABLE = "attendees";
const BUCKET = "qr-codes";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Locally SUPABASE_URL is http://..., on the hosted project it is https://...
const IS_HOSTED = SUPABASE_URL.startsWith("https://");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const EVENT_NAME = Deno.env.get("EVENT_NAME") ?? "Our Event";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---- Helpers ----------------------------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Constant-time string comparison (avoids leaking the secret via timing). */
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) {
    diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  }
  return diff === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_FILENAME = /^[A-Za-z0-9_-]{16,128}$/;

interface AttendeeRow {
  id: string;
  name: string;
  email: string;
  organization: string;
  token: string;
  emailSentAt: string | null;
}

function toAttendee(record: Record<string, unknown>): AttendeeRow | null {
  const id = record[COL.id];
  const email = record[COL.email];
  const token = record[COL.token];
  if (typeof id !== "string" || !UUID_RE.test(id)) return null;
  if (typeof email !== "string" || !EMAIL_RE.test(email)) return null;
  if (typeof token !== "string" || token.length < 16) return null;
  return {
    id,
    email,
    token,
    name: String(record[COL.name] ?? "Attendee"),
    organization: String(record[COL.organization] ?? ""),
    emailSentAt: (record[COL.emailSentAt] as string | null | undefined) ?? null,
  };
}

async function issueTicket(a: AttendeeRow, isResend: boolean): Promise<string> {
  // 2. QR image from the token only
  const png: Uint8Array = await QRCode.toBuffer(a.token, {
    type: "png",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  // 3. Upload as <qr_token>.png (falls back to <id>.png if the token has
  //    characters that are unsafe in a file name). upsert => safe to run twice.
  const filePath = `${SAFE_FILENAME.test(a.token) ? a.token : a.id}.png`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, Buffer.from(png), {
      contentType: "image/png",
      upsert: true,
    });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { error: pathError } = await supabase
    .from(TABLE)
    .update({ [COL.imagePath]: filePath })
    .eq(COL.id, a.id);
  if (pathError) throw new Error(`Saving qr_image_path failed: ${pathError.message}`);

  // 4. Email. The QR is embedded inline (CID), so it shows in Gmail/Outlook
  //    without depending on the bucket being public or on a reachable URL.
  const content = {
    name: a.name,
    organization: a.organization,
    eventName: EVENT_NAME,
  };
  await sendTicketEmail({
    to: a.email,
    subject: buildSubject(EVENT_NAME),
    html: buildHtml(content),
    text: buildText(content),
    png,
    idempotencyKey: isResend ? undefined : `ticket-${a.id}`,
  });

  // 5. Mark as sent. The email already went out, so a failure here is logged
  //    but does not fail the request.
  const { error: sentError } = await supabase
    .from(TABLE)
    .update({ [COL.emailSentAt]: new Date().toISOString() })
    .eq(COL.id, a.id);
  if (sentError) console.error(`Saving email_sent_at failed: ${sentError.message}`);

  return filePath;
}

// ---- Handler ----------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Fail closed: refuse to run if the secret is missing, or is still the
  // placeholder on the hosted project.
  if (!WEBHOOK_SECRET || (IS_HOSTED && WEBHOOK_SECRET === "change-me")) {
    console.error("WEBHOOK_SECRET is not set (or still 'change-me' in production).");
    return json({ error: "Server misconfigured" }, 500);
  }
  if (!safeEqual(req.headers.get("x-webhook-secret") ?? "", WEBHOOK_SECRET)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    let attendee: AttendeeRow | null;
    let isResend = false;

    if (payload.resend === true) {
      // Manual resend by id
      isResend = true;
      const id = payload.id;
      if (typeof id !== "string" || !UUID_RE.test(id)) {
        return json({ error: "Invalid id" }, 400);
      }
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq(COL.id, id)
        .maybeSingle();
      if (error) throw new Error(`Lookup failed: ${error.message}`);
      if (!data) return json({ error: "Attendee not found" }, 404);
      attendee = toAttendee(data);
    } else {
      // Database Webhook payload: { type, table, schema, record, old_record }
      if (payload.type !== "INSERT" || payload.table !== TABLE) {
        return json({ ignored: true });
      }
      attendee = toAttendee((payload.record ?? {}) as Record<string, unknown>);
    }

    if (!attendee) return json({ error: "Invalid attendee record" }, 400);

    // Already emailed (e.g. webhook delivered twice): do nothing.
    if (!isResend && attendee.emailSentAt) {
      return json({ ignored: true, reason: "already sent" });
    }

    const file = await issueTicket(attendee, isResend);
    console.log(`Ticket sent: attendee=${attendee.id} file=${file}`);
    return json({ ok: true, file });
  } catch (err) {
    // Log details server-side; don't leak internals to the caller.
    console.error("send-ticket failed:", err);
    return json({ error: "Failed to send ticket" }, 500);
  }
});