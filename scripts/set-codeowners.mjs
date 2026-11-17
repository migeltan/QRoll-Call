#!/usr/bin/env node
// Fills the @ROLE1..@ROLE5 placeholders in .github/CODEOWNERS with real GitHub usernames.
// Usage: node scripts/set-codeowners.mjs lead-user db-user qr-user form-user checkin-user
import { readFileSync, writeFileSync } from 'node:fs';

const users = process.argv.slice(2).map((u) => u.replace(/^@/, ''));
if (users.length !== 5) {
  console.error('Usage: node scripts/set-codeowners.mjs <role1> <role2> <role3> <role4> <role5>');
  process.exit(1);
}

const file = new URL('../.github/CODEOWNERS', import.meta.url);
let text = readFileSync(file, 'utf8');
users.forEach((user, i) => {
  text = text.replace(new RegExp(`@ROLE${i + 1}(?!\\d)`, 'g'), `@${user}`);
});
writeFileSync(file, text);
console.log('Updated .github/CODEOWNERS');
