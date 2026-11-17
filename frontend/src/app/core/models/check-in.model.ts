// Shape returned by the Postgres function check_in(p_token) (see docs/CONTRACTS.md).
// Owner: Role 5 (Staff Auth + Check-in Scanner). Role 2 keeps the SQL side in sync.

export type CheckInStatus = 'checked_in' | 'already_checked_in' | 'invalid_token';

export interface CheckInResult {
  status: CheckInStatus;
  /** null when status is 'invalid_token' */
  attendee: {
    full_name: string;
    organization: string;
    checked_in_at: string | null;
  } | null;
}
