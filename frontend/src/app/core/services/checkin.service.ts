// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable } from '@angular/core';
import type { CheckInResult } from '../models/check-in.model';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class CheckinService {
  /** Marks the attendee that owns this QR token as checked in. */
  async checkIn(token: string): Promise<CheckInResult> {
    const { data, error } = await supabase.rpc('check_in', { p_token: token });
    if (error) throw error;
    return data as unknown as CheckInResult;
  }
}