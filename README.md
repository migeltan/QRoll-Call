# QR Event Check-in

A QR-based event registration and check-in system. Attendees register on a web form, automatically receive an emailed QR ticket, and are scanned in at the entrance on event day.

**Stack:** Angular + Angular Material (frontend) · Supabase (Postgres, Auth, Storage, Edge Functions) · Resend (email) · Cloudflare Pages or Vercel (hosting)

Read these first (5 minutes):
- [docs/PROJECT.md](docs/PROJECT.md) - what we are building and what "done" means
- [docs/ROLES.md](docs/ROLES.md) - **your role, your branch, and the files you own**
- [docs/CONTRACTS.md](docs/CONTRACTS.md) - the agreements between roles (table, functions, QR format)

## Repo layout
```
frontend/               Angular app (Roles 4 and 5)
  src/app/core/         Supabase client, auth, models, services
  src/app/features/     register/ (R4)  auth/ checkin/ attendees/ staff/ (R5)
  src/app/shared/       Layout (R4)
backend/                Supabase project (Roles 2 and 3)
  supabase/migrations/  Database (R2; one migration each from R3 and R5)
  supabase/functions/   send-ticket Edge Function (R3)
docs/                   Project docs, contracts, test log
scripts/                Ownership check and GitHub helpers
.github/                CODEOWNERS, PR template, CI
```

## Set up your machine (one time)
You need **Node 22**, **Git**, and **Docker Desktop** (running).

```bash
git clone <repo-url>
cd qr-checkin
git checkout role/<your-branch>        # see the table in docs/ROLES.md

cd frontend && npm ci && cd ..
cd backend  && npm ci && cd ..
```

## Run it locally
```bash
# Terminal 1 - local Supabase (first run downloads images, takes a few minutes)
cd backend
npm run db:start
npm run db:status          # shows the API URL and anon key

# Terminal 2 - Angular app
cd frontend
npm start                  # http://localhost:4200
```
Local database tools: Supabase Studio at http://127.0.0.1:54323, test inbox (Mailpit) at http://127.0.0.1:54324.

Other backend commands (run in `backend/`): `npm run db:reset` (re-apply migrations + seed), `npm run types` (regenerate frontend types, Role 2), `npm run functions:serve` (run the Edge Function locally, Role 3).

## Daily workflow
1. Work **only on your role branch** (`git branch --show-current` to check) and only in your own files.
2. Commit small and often; push your branch.
3. Open a Pull Request **from your branch into `main`**. Fill in the template and add your result to `docs/TEST_LOG.md`.
4. The Lead reviews and merges. CI must pass (build, tests, ownership check).
5. After anything merges to `main`, update your branch: `git fetch origin && git merge origin/main`.

Check you stayed in your lane before opening a PR:
```bash
node scripts/check-ownership.mjs origin/main $(git branch --show-current)
```

## Rules
- Never commit secrets: no service role key, no API keys, no `.env`. Ask the Lead for the values.
- Files you do not own are not yours to edit. Ask the Lead, who can change the ownership rules.
- Need a new npm package? Ask the Lead.
- If you change an agreed contract (table columns, function results, QR format), update `docs/CONTRACTS.md` and tell the affected roles first.

## Lead checklist (before sharing the repo)
1. `./scripts/create-github-repo.sh <repo-name>` creates the repo, pushes all branches, protects `main`.
2. Invite the four teammates as collaborators.
3. `./scripts/set-codeowners.sh <role1> <role2> <role3> <role4> <role5>` (GitHub usernames), commit on `role/lead-devops`, merge to `main`.
4. Run `npm run db:start` + `npm run db:status` once, paste the local anon key into `frontend/src/environments/environment.development.ts`, and merge to `main`. Local keys are the same for everyone using the same CLI version, so teammates then need no setup.
5. Create the hosted Supabase project, fill `environment.ts` with its URL and anon key, and connect Cloudflare Pages or Vercel (build command `npm run build`, root `frontend`, output `dist/frontend/browser`).
6. Decide the email provider (Resend with a verified domain, or Gmail SMTP) and tell Role 3.
