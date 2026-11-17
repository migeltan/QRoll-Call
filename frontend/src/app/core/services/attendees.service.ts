// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable } from '@angular/core';
import type { Database } from '../models/database.types';
// import { supabase } from '../supabase/supabase.client';

export type Attendee = Database['public']['Tables']['attendees']['Row'];

@Injectable({ providedIn: 'root' })
export class AttendeesService {
  /**
   * TODO(role-5): select all attendees (RLS only lets logged-in staff read them).
   */
  async list(): Promise<Attendee[]> {
    throw new Error('TODO(role-5): implement AttendeesService.list');
  }

  /**
   * TODO(role-5): turn the list into CSV text for the organizer's export button
   * (this CSV is also the offline fallback attendee list on event day).
   */
  toCsv(_attendees: Attendee[]): string {
    throw new Error('TODO(role-5): implement AttendeesService.toCsv');
  }
}
