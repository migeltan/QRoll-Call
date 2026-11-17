#!/usr/bin/env bash
# Fills the @ROLE1..@ROLE5 placeholders in .github/CODEOWNERS with real GitHub usernames.
# Usage: ./scripts/set-codeowners.sh lead-user db-user qr-user form-user checkin-user
set -euo pipefail

if [ "$#" -ne 5 ]; then
  echo "Usage: $0 <role1-user> <role2-user> <role3-user> <role4-user> <role5-user>" >&2
  exit 1
fi

file="$(dirname "$0")/../.github/CODEOWNERS"
for i in 1 2 3 4 5; do
  user="${!i#@}"
  sed -i.bak "s/@ROLE${i}\b/@${user}/g" "$file"
done
rm -f "$file.bak"
echo "Updated $file"
