// Helpers that describe when an event code / QR pass stops working.
// Everything is shown in Philippine time because that is where the events happen.

export type ExpiryLevel = 'ok' | 'soon' | 'expired';

export function formatPH(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  });
}

export function describeExpiry(expiresAt: string, now = new Date()): { level: ExpiryLevel; text: string } {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return { level: 'expired', text: 'Expired' };
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60_000));
    return { level: 'soon', text: `Expires in ${mins} minute${mins === 1 ? '' : 's'}` };
  }
  if (hours < 24) return { level: 'soon', text: `Expires in ${hours} hour${hours === 1 ? '' : 's'}` };
  const days = Math.floor(hours / 24);
  return { level: 'ok', text: `Valid for ${days} more day${days === 1 ? '' : 's'}` };
}
