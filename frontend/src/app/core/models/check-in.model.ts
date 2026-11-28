// Shape returned by the Postgres function check_in(p_token) (see docs/CONTRACTS.md).
// Owner: Role 5 (Staff Auth + Check-in Scanner). Role 2 keeps the SQL side in sync.

export type CheckInStatus = 'checked_in' | 'already_checked_in' | 'invalid_token' | 'expired_token';

export interface CheckInResult {
  status: CheckInStatus;
  /** null when status is 'invalid_token' */
  attendee: {
    /** The contract names this field "name" (not full_name). */
    name: string;
    organization: string;
    checked_in_at: string | null;
  } | null;
  /** Events feature: title of the event the pass belongs to, and when the pass expires. */
  event_title?: string | null;
  expires_at?: string | null;
}
