# Test Log

Everyone may add rows here (it is the one shared file). Record each stage verification as you do it.

| Date       | Stage            | Tester (role) | What was tested                                                                                                   | Result | Notes                                                                                      |
| ---------- | ---------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| 2026-11-28 | 1 Form           | Role 4        | Submitted test entry on localhost:4200; checked row in public.attendees via Studio; tested resubmitted same email | *Pass* | Local Supabase with Role 2 + Role 5 migrations copied in (not yet on main). Details below. |
|            | 2 QR             |               | Test submission created a unique QR image                                                                         |        |                                                                                            |
|            | 3 Email          |               | Test inbox received the email and the QR displays                                                                 |        |                                                                                            |
|            | 4 Scan           |               | Scanned test QR; attendee marked "Checked In"                                                                     |        |                                                                                            |
|            | End to end       | Lead          | Form → QR → email → scan on the deployed site                                                                     |        |                                                                                            |
|            | Offline fallback | Lead          | Same flow on the local Supabase laptop                                                                            |        |                                                                                            |

### Stage 1 details (Role 4, 2026-11-28)

**Environment:** Angular dev server at http://localhost:4200, local Supabase (Docker). Role 2 and Role 5 migrations were copied in locally for testing and removed before committing.

| # | Test                                           | Expected                                                               | Result |
| - | ---------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| 1 | Submit a valid entry on localhost:4200         | Goes to `/registered` with the "You're registered!" page               | Pass   |
| 2 | Check the row in `public.attendees` via Studio | `full_name`, `email`, `organization`, `contact_number` stored as typed | Pass   |
| 3 | Submit the same email a second time            | Yellow "Already registered" warning (Postgres 23505), stays on form    | Pass   |

**Not run yet:** field validation errors, case-insensitive duplicate email, mobile layout, double-submit prevention.

**Out of scope for this stage:** QR image and email (Role 3), check-in scanning (Role 5), hosted deploy.

**Issues found:** None.

**Follow-up:** Re-test after other roles merge to `main` and the Lead runs `db:reset`.