# Technology Stack

| Layer | Choice | Why | Cost |
|---|---|---|---|
| Frontend | Angular + Angular Material | Reactive forms with built-in validation for the registration form, plus tables and dialogs for the organizer's attendee list. | Free |
| Database | Supabase Postgres | One `attendees` table (name, email, organization, contact number, QR token, status, checked-in time). | Free tier |
| Auth | Supabase Auth (email/password) | Only organizers and check-in staff log in. Attendees don't need accounts. | Free tier |
| Access control | Postgres Row-Level Security (RLS) | The public can only register through one function. Only logged-in staff can read the list or mark check-ins. | Free |
| QR generation | Supabase Edge Function (Deno) + `qrcode` library, triggered by a Database Webhook on insert | Meets the "script triggers when a new row is added" requirement. It encodes a random unique token (not the email) into a QR image. | Free tier |
| File storage | Supabase Storage (`qr-codes` bucket) | Stores each generated QR image, so we can verify a unique file exists per attendee. | Free tier |
| Email delivery | Resend API, called from the same Edge Function | Sends the confirmation email with the QR image embedded, right after generation. | Free tier |
| Check-in logic | Postgres function (RPC) `check_in(token)` | Looks up the token and marks "Checked In" in one step. Returns "already checked in" on a duplicate scan. | Free |
| Check-in scanner | Angular scanner page using `html5-qrcode` (phone camera in the browser) | No app install needed. Staff open the page, log in, and scan. Each scan calls the RPC above. | Free |
| Frontend hosting | Cloudflare Pages or Vercel (pick one) | Auto-deploys from GitHub on every push to main. Gives us the HTTPS that phone cameras require. | Free |
| Source control | GitHub (one repo, PRs required) | Team workflow. | Free |
| Offline fallback | Docker Desktop + Supabase CLI (local Supabase) + built Angular app on one laptop, plus an exported attendee CSV | Same schema and code running locally. A USB barcode scanner on the laptop also works as a last resort, since it types the token like a keyboard. | Free |

## Things to settle early
- **Email provider:** Resend's free tier limits volume and needs a verified domain to email arbitrary recipients. Without a domain, the fallback is Gmail SMTP from the Edge Function (daily limit applies). This affects Stage 3.
- **QR in email:** Gmail often blocks embedded base64 images, so the email references the QR image by its public Storage URL (or attaches it).
- **Scanner choice:** A generic scanning app only reads the code's text and can't mark anyone "Checked In". Our own scanner page satisfies the Stage 4 verification.
- **Camera on event day:** Phone cameras need HTTPS, so the deployed URL works. The local offline setup needs a workaround, which is why the USB barcode scanner is in the fallback.
