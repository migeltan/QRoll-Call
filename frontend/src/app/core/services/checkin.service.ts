// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable } from '@angular/core';
import type { CheckInResult } from '../models/check-in.model';
// import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class CheckinService {
  /**
   * Marks the attendee that owns this QR token as checked in.
   *
   * TODO(role-5): call the `check_in` RPC with { p_token: token } and cast `data` to CheckInResult.
   * Statuses: 'checked_in' | 'already_checked_in' | 'invalid_token' (see docs/CONTRACTS.md).
   */
  async checkIn(_token: string): Promise<CheckInResult> {
    throw new Error('TODO(role-5): implement CheckinService.checkIn');
  }
}
