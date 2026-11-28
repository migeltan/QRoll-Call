// Turns pasted text or an uploaded CSV into a clean list of accepted names.
// Accepts one person per line: "Full Name" or "Full Name, email@example.com".
// A first line like "Name" or "Full name, Email" is treated as a header and skipped.
import type { AllowedName } from './event.model';

export interface ParsedNames {
  rows: AllowedName[];
  /** Lines that could not be used (too short, too long, or a bad email) */
  skipped: string[];
  /** Repeated lines that were dropped */
  duplicates: number;
}

export const MAX_NAMES = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if ((ch === ',' || ch === ';') && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseNames(text: string): ParsedNames {
  const lines = text
    .replace(/^\ufeff/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: AllowedName[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  lines.forEach((line, i) => {
    const cols = splitLine(line);
    const name = (cols[0] ?? '').replace(/\s+/g, ' ').trim();
    const email = (cols[1] ?? '').trim().toLowerCase();
    if (i === 0 && /^(full\s*)?name$/i.test(name)) return; // header row
    if (name.length < 2 || name.length > 120 || (email && !EMAIL_RE.test(email))) {
      skipped.push(line);
      return;
    }
    const key = `${name.toLowerCase()}|${email}`;
    if (seen.has(key)) {
      duplicates++;
      return;
    }
    seen.add(key);
    rows.push({ full_name: name, email: email || null });
  });

  return { rows, skipped, duplicates };
}
