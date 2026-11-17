#!/usr/bin/env bash
# Lead only. Creates the GitHub repo, pushes main + all five role branches, and turns on
# branch protection for main (PRs required, CI must pass, code owner review).
#
# Prerequisites: GitHub CLI installed and logged in (`gh auth login`).
# Usage:  ./scripts/create-github-repo.sh <repo-name> [--public]
#
# Note: branch protection on PRIVATE repos needs a paid GitHub plan. On a free plan either make
# the repo public, or skip protection and rely on team discipline plus the CI checks.
set -euo pipefail

name="${1:?Usage: $0 <repo-name> [--public]}"
visibility="--private"
[ "${2:-}" = "--public" ] && visibility="--public"

gh repo create "$name" "$visibility" --source=. --remote=origin
git push -u origin --all

repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

gh api -X PUT "repos/$repo/branches/main/protection" --input - <<'JSON' || \
  echo "Could not set branch protection (likely a free private repo). Set it manually: Settings > Branches."
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["Frontend build and tests", "Role ownership check"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null
}
JSON

echo "Done: https://github.com/$repo"
echo "Next: invite your four teammates as collaborators (Settings > Collaborators)."
