# Contracts between roles

These are the agreements that let five people work in parallel. If you change one, update this file and tell the affected roles **before** merging.

## Table: `public.attendees` (Role 2)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | `gen_random_uuid()` |
| `full_name` | text, required | |
| `email` | text, required | unique, case-insensitive |
| `organization` | text, required | |
| `contact_number` | text, required | |
| `qr_token` | uuid, unique | what the QR encodes (never the email) |
| `qr_image_path` | text, nullable | path in the `qr-codes` bucket, set by Role 3 |
| `email_sent_at` | timestamptz, nullable | set by Role 3 |
| `status` | text | `registered` (default) or `checked_in` |
| `checked_in_at` | timestamptz, nullable | |
| `checked_in_by` | uuid, nullable | staff user who scanned |
| `created_at` | timestamptz | default `now()` |

## Function: `register_attendee` (Role 2 writes, Role 4 calls)
`register_attendee(p_full_name, p_email, p_organization, p_contact_number) → uuid` (the new attendee id).
Callable by `anon`. A duplicate email raises Postgres error code `23505`.

## Function: `check_in` (Role 2 writes, Role 5 calls)
`check_in(p_token text) → jsonb`, callable by staff only.

| `status` | Meaning | `attendee` |
|---|---|---|
| `checked_in` | First valid scan, attendee is now checked in | name, organization, checked_in_at |
| `already_checked_in` | Duplicate scan, nothing changed | name, organization, original checked_in_at |
| `invalid_token` | No attendee has this token | `null` |

## Function: `is_staff()` (Role 5 writes, Role 2 uses)
`is_staff() → boolean`: true when the signed-in user is in `staff_profiles`.

## QR code (Role 3 writes, Role 5 reads)
- The QR encodes **only** the attendee's `qr_token` as plain text.
- Image is a PNG at `qr-codes/<qr_token>.png` in a public bucket.

## Edge Function webhook (Role 3)
- Triggered on insert into `attendees`, authenticated by the `x-webhook-secret` header.
- Secrets live in `backend/supabase/functions/.env` (gitignored), never in the repo.

## Migration order
Migrations run in filename order: `01` table (Role 2) → `02` staff roles (Role 5) → `03` policies (Role 2) → `04` functions (Role 2) → `05` storage (Role 2) → `06` webhook (Role 3).

## Staff accounts
_Role 5: document here how an account becomes staff (e.g. Lead creates the user in Supabase Studio, then you add their id to `staff_profiles`)._
