# Roles and Branches

One developer per branch. Work **only** on your own branch and only in the files your role owns.
CI (`scripts/check-ownership.mjs`) fails a pull request that touches someone else's files.

| # | Role | Branch | Side | Stage |
|---|---|---|---|---|
| 1 | Project Lead / DevOps / Integration | `role/lead-devops` | Both (infrastructure) | All (end-to-end testing) |
| 2 | Database / Supabase | `role/database` | Backend | Stage 2 (data) |
| 3 | QR Generation + Email Automation | `role/qr-email` | Backend | Stages 2 and 3 |
| 4 | Registration Form + App Shell | `role/registration` | Frontend | Stage 1 |
| 5 | Staff Auth + Check-in Scanner | `role/checkin` | Frontend (plus one backend migration) | Stage 4 |

## Role 1 - Project Lead / DevOps / Integration (`role/lead-devops`)
**Owns:** `.github/`, `docs/`, `scripts/`, root `README.md`, `frontend/angular.json`, `frontend/package.json`, `frontend/src/environments/`, `backend/package.json`, `backend/supabase/config.toml`, hosting settings (Cloudflare Pages or Vercel), and the offline fallback (Docker + local Supabase, attendee CSV export).
- [ ] Create the hosted Supabase project and share the keys with Roles 3, 4 and 5 privately (never in the repo)
- [ ] Connect hosting to GitHub so every push to `main` deploys
- [ ] Review PRs and resolve merge conflicts
- [ ] Prepare and rehearse the offline fallback
- [ ] Run the final form → QR → email → scan test and record it in `docs/TEST_LOG.md`

## Role 2 - Database / Supabase (`role/database`)
**Owns:** `backend/supabase/migrations/` files `…01_attendees_table`, `…03_attendee_policies`, `…04_rpc_functions`, `…05_storage_qr_codes`, `backend/supabase/seed.sql`, and `frontend/src/app/core/models/database.types.ts`.
- [ ] `attendees` table and RLS policies
- [ ] `register_attendee()` and `check_in(token)` functions, exactly as in [CONTRACTS.md](CONTRACTS.md)
- [ ] `qr-codes` storage bucket and rules
- [ ] Seed test attendees
- [ ] Publish the schema **first** so others can build against it, then regenerate `database.types.ts` (`cd backend && npm run types`)

## Role 3 - QR Generation + Email Automation (`role/qr-email`)
**Owns:** `backend/supabase/functions/` (the `send-ticket` Edge Function, email template, `.env.example`) and `backend/supabase/migrations/…06_send_ticket_webhook.sql`.
- [ ] Webhook fires on insert into `attendees`
- [ ] Generate a unique QR image from `qr_token`, upload to the `qr-codes` bucket, save `qr_image_path`
- [ ] Send the confirmation email with the QR displayed, set `email_sent_at`
- [ ] **Verify:** a unique QR file exists per entry, and the test inbox shows the QR correctly

## Role 4 - Registration Form + App Shell (`role/registration`)
**Owns:** `frontend/src/app/features/register/`, `shared/` (layout), `core/supabase/`, `core/services/registration.service.ts`, `app.*` (routes, config, root component), `styles.scss`, `index.html`, `main.ts`, `public/`.
- [ ] Reactive form: Full Name, Email Address, Organization, Contact Number, with validation
- [ ] Submit through `RegistrationService` and show success / duplicate-email / error states
- [ ] App shell (toolbar, layout) and Material theme
- [ ] **Verify:** a test entry lands correctly in the database

## Role 5 - Staff Auth + Check-in Scanner (`role/checkin`)
**Owns:** `frontend/src/app/features/auth/`, `features/checkin/`, `features/attendees/`, `features/staff/`, `core/auth/`, `core/models/check-in.model.ts`, `core/services/checkin.service.ts`, `core/services/attendees.service.ts`, and the migration `…02_staff_roles.sql`.
- [ ] Staff login (Supabase Auth email/password) and route guard
- [ ] Staff roles migration: `staff_profiles` table and `is_staff()` function
- [ ] Scanner page with `html5-qrcode` showing "Checked In", "Already checked in", "Invalid ticket"
- [ ] Organizer attendee list with search and CSV export
- [ ] **Verify:** scanning the test QR code marks the attendee "Checked In"

## Handoffs
- **2 → 3, 4, 5:** Role 2 publishes the table schema and the `check_in` function first.
- **5 → 2:** `is_staff()` (Role 5's migration) is used by Role 2's policies. Keep its name and signature.
- **4 → 3:** The form's insert is what triggers Role 3's function during testing.
- **3 → 1:** The webhook and secrets live on the hosted Supabase project; Role 1 confirms everyone uses the same project or the same local setup.

## Need a file that is not yours?
Ask the Lead. If you need a new npm package, ask the Lead too (it changes `package.json`).
