// Edge Function: generate the QR ticket and email it.
// Owner: Role 3 (QR Generation + Email Automation).
//
// Triggered by the Database Webhook on INSERT into public.attendees
// (see migrations/20261117000006_send_ticket_webhook.sql).
// The webhook body looks like: { type: 'INSERT', table: 'attendees', record: { ...row }, ... }
//
// TODO(role-3):
//   1. Reject the request unless header `x-webhook-secret` equals the WEBHOOK_SECRET env var.
//   2. Read `record` (id, full_name, email, qr_token) from the body.
//   3. Generate a PNG QR code that encodes ONLY `record.qr_token` (not the email), using the
//      `qrcode` library, e.g.  import QRCode from 'npm:qrcode';
//   4. Upload it to Storage bucket `qr-codes` as `<qr_token>.png` (service role client),
//      then update attendees.qr_image_path.
//   5. Email the attendee (Resend API, or Gmail SMTP as fallback) with the QR image shown in the
//      body - reference the public Storage URL rather than a base64 image (Gmail blocks base64).
//   6. Set attendees.email_sent_at = now() and return 200.
//
// Secrets live in supabase/functions/.env (gitignored) - copy .env.example and ask the Lead
// for the values. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ error: 'TODO(role-3): send-ticket is not implemented yet' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
