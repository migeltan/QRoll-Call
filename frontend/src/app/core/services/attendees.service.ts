// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable } from '@angular/core';
import type { Database } from '../models/database.types';
import { supabase } from '../supabase/supabase.client';

export type Attendee = Database['public']['Tables']['attendees']['Row'];

@Injectable({ providedIn: 'root' })
export class AttendeesService {
  /** RLS only lets logged-in staff read this table. */
  async list(): Promise<Attendee[]> {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** CSV text for the export button (also the offline backup list on event day). */
  toCsv(attendees: Attendee[]): string {
    const header = ['Full name', 'Email', 'Organization', 'Contact number', 'Status', 'Checked in at'];
    const lines = attendees.map((a) =>
      [a.full_name, a.email, a.organization, a.contact_number, a.status, a.checked_in_at ?? '']
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