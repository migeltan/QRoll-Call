## What this PR does
<!-- One or two sentences. -->

## Role / branch
<!-- e.g. Role 4 - role/registration -->

## How I verified it
<!-- The Stage verification from docs/ROLES.md, e.g. "submitted a test entry, row appears in attendees". Add the result to docs/TEST_LOG.md. -->

## Checklist
- [ ] I only changed files my role owns (`node scripts/check-ownership.mjs origin/main <my-branch>` passes)
- [ ] `npm run build` passes in `frontend/`
- [ ] If I changed the database or an agreed contract, I updated `docs/CONTRACTS.md` and told the affected roles
- [ ] No secrets committed (service role key, API keys, `.env`)
