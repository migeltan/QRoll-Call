// Owner: Role 5 (Staff Auth + Check-in Scanner).
// Talks to the create_event() and list_events() Postgres functions (see the events proposal).
import { Injectable } from '@angular/core';
import { supabase } from '../../../core/supabase/supabase.client';
import type { EventRow, NewEventInput } from './event.model';

export class EventsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventsError';
  }
}

function friendly(err: { code?: string; message?: string }): EventsError {
  const msg = err.message ?? '';
  if (err.code === 'PGRST202' || err.code === '42883' || msg.includes('Could not find the function')) {
    return new EventsError(
      'Events are not set up in the database yet. Ask the Database owner to apply the events migration.',
    );
  }
  if (msg.includes('NOT_AUTHORIZED') || err.code === '42501') {
    return new EventsError('Only organizers can manage events.');
  }
  if (msg.includes('PAST_DATE')) return new EventsError('Pick today or a later date for the event.');
  if (msg.includes('TITLE_REQUIRED')) return new EventsError('Give the event a title.');
  return new EventsError(msg || 'Something went wrong. Please try again.');
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  async list(): Promise<EventRow[]> {
    // Cast: database.types.ts doesn't list these functions until the types are regenerated.
    const { data, error } = await supabase.rpc('list_events' as never);
    if (error) throw friendly(error);
    return (data as unknown as EventRow[] | null) ?? [];
  }

  async create(input: NewEventInput): Promise<EventRow> {
    const { data, error } = await supabase.rpc(
      'create_event' as never,
      {
        p_title: input.title,
        p_details: input.details || null,
        p_event_date: input.event_date,
        p_accepted_organizations: input.accepted_organizations,
        p_max_attendees: input.max_attendees,
        p_allowed_names: input.allowed_names,
      } as never,
    );
    if (error) throw friendly(error);
    if (!data) throw new EventsError('The event was not created. Please try again.');
    return data as unknown as EventRow;
  }
}
