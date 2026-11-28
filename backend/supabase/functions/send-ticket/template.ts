// backend/supabase/functions/send-ticket/template.ts
// Email HTML + plain-text templates. Table-based layout with inline styles
// so it renders in Gmail, Outlook and mobile mail apps.
// The QR is referenced as cid:qr-ticket (attached inline by email.ts).

export interface TicketContent {
  name: string;
  organization: string;
  eventName: string;
}

export const QR_CID = "qr-ticket";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildSubject(eventName: string): string {
  return `Your QR ticket for ${eventName}`;
}

export function buildHtml({ name, organization, eventName }: TicketContent): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(buildSubject(eventName))}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;">
      <tr>
        <td style="padding:32px 24px;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">You're registered!</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#555555;">
            Hi ${esc(name)}, thanks for registering for <strong>${esc(eventName)}</strong>.
            Show the QR code below at the entrance.
          </p>
          <img src="cid:${QR_CID}" alt="Your QR ticket" width="260" height="260"
               style="display:block;margin:0 auto 16px;border:0;background:#ffffff;" />
          <p style="margin:0;font-size:16px;font-weight:bold;color:#1a1a2e;">${esc(name)}</p>
          <p style="margin:0 0 24px;font-size:14px;color:#777777;">${esc(organization)}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#777777;">
            This ticket works once. Please don't share it or post it online.
            If the image doesn't show, open the attached <em>qr-ticket.png</em>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildText({ name, organization, eventName }: TicketContent): string {
  return [
    `Hi ${name},`,
    ``,
    `You're registered for ${eventName}.`,
    organization ? `Organization: ${organization}` : ``,
    ``,
    `Your QR ticket is attached (qr-ticket.png). Show it at the entrance.`,
    `It works once, so please don't share it.`,
  ]
    .filter((line, i, arr) => !(line === `` && arr[i - 1] === ``))
    .join("\n");
}