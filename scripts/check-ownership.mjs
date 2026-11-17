#!/usr/bin/env node
// Fails if a role branch changes files outside the paths that role owns.
// Rules live in .github/ownership.json.
//
// Usage:  node scripts/check-ownership.mjs <base-ref> <branch-name>
//   e.g.  node scripts/check-ownership.mjs origin/main role/registration
// Run it locally before opening a PR.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [base = 'origin/main', branch = ''] = process.argv.slice(2);
const rules = JSON.parse(readFileSync(new URL('../.github/ownership.json', import.meta.url), 'utf8'));

const patterns = rules.branches[branch];
if (!patterns) {
  console.log(`No ownership rules for branch "${branch}" - skipping check.`);
  process.exit(0);
}

const toRegex = (glob) =>
  new RegExp(
    '^' +
      glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0000/g, '.*') +
      '$',
  );

const allowed = [...patterns, ...rules.shared].map(toRegex);
const changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const outside = changed.filter((file) => !allowed.some((re) => re.test(file)));

if (outside.length > 0) {
  console.error(`Branch "${branch}" changed files it does not own:\n`);
  outside.forEach((f) => console.error(`  - ${f}`));
  console.error('\nMove those changes to the right role branch, or ask the Lead (see docs/ROLES.md).');
  process.exit(1);
}

console.log(`OK: all ${changed.length} changed file(s) belong to "${branch}".`);
