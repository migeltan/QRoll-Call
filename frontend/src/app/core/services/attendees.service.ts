// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable } from '@angular/core';
import type { Database } from '../models/database.types';
import { supabase } from '../supabase/supabase.client';

// event_id is added by the events migration. It is optional here so this file still compiles
// before database.types.ts is regenerated (older rows have no event).
export type Attendee = Database['public']['Tables']['attendees']['Row'] & { event_id?: string | null };

@Injectable({ providedIn: 'root' })
export class AttendeesService {
  /** RLS only lets logged-in staff read this table. */
  async list(): Promise<Attendee[]> {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Attendee[];
  }

  /**
   * CSV text for the export button (also the offline backup list on event day).
   * `titleOf` turns an event id into its title for the Event column.
   */
  toCsv(attendees: Attendee[], titleOf: (eventId: string | null | undefined) => string = () => ''): string {
    const header = ['Event', 'Full name', 'Email', 'Organization', 'Contact number', 'Status', 'Checked in at'];
    const lines = attendees.map((a) =>
      [titleOf(a.event_id), a.full_name, a.email, a.organization, a.contact_number, a.status, a.checked_in_at ?? '']
        .map((v) => this.cell(String(v)))
        .join(','),
    );
    return [header.join(','), ...lines].join('\r\n');
  }

  private cell(value: string): string {
    // Neutralize spreadsheet formulas, then quote.
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  }
}
