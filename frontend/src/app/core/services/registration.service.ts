// Handles public attendee registration via the `register_attendee` Supabase RPC.
// Owner: Role 4 (Registration Form + App Shell).
// Events update: registrations now belong to an event, so the attendee types an event code.
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { supabase } from '../supabase/supabase.client';

export interface RegistrationInput {
  eventCode: string;
  fullName: string;
  email: string;
  organization: string;
  contactNumber: string;
}

/** What the form may show about an event before the attendee submits (from get_event_public). */
export interface PublicEvent {
  title: string;
  details: string | null;
  /** Calendar date, YYYY-MM-DD */
  event_date: string;
  /** The code and every QR pass stop working at this moment (end of event_date, Manila time). */
  expires_at: string;
  accepted_organizations: string[];
  restrict_to_list: boolean;
  is_full: boolean;
  is_open: boolean;
}

/** Raised when Postgres unique index reports duplicate email in this event (SQLSTATE 23505). */
export class DuplicateRegistrationError extends Error {
  constructor(message = 'This email address is already registered for this event.') {
    super(message);
    this.name = 'DuplicateRegistrationError';
  }
}

/** Raised when registration fails for configuration, network, or server reasons. */
export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistrationError';
  }
}

/** The database raises these plain words; show attendees something friendly instead. */
const FRIENDLY_ERRORS: ReadonlyArray<readonly [string, string]> = [
  ['EVENT_NOT_FOUND', "We couldn't find that event code. Check it with your organizer."],
  ['EVENT_EXPIRED', 'This event has ended, so its code no longer works.'],
  ['EVENT_FULL', 'This event is full.'],
  ['ORG_NOT_ACCEPTED', 'This event only accepts the organizations listed.'],
  [
    'NAME_NOT_ON_LIST',
    "Your name (and email, if the organizer listed one) isn't on this event's guest list.",
  ],
  ['NAME_ALREADY_REGISTERED', 'A pass has already been issued for this name.'],
];

function friendlyMessage(message: string): string | null {
  return FRIENDLY_ERRORS.find(([key]) => message.includes(key))?.[1] ?? null;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  /**
   * Looks up an event by its code so the form can show the title and how long the QR pass will
   * be valid. Resolves null when no event has that code.
   */
  async getEvent(code: string): Promise<PublicEvent | null> {
    // Cast: database.types.ts doesn't list this function until the types are regenerated.
    const { data, error } = await supabase.rpc('get_event_public' as never, { p_code: code.trim() } as never);
    if (error) {
      throw new RegistrationError('Could not check the event code. Please try again.');
    }
    return (data as unknown as PublicEvent | null) ?? null;
  }

  /**
   * Calls `register_attendee(p_event_code, p_full_name, p_email, p_organization, p_contact_number)`
   * and resolves with the created attendee UUID.
   */
  async register(input: RegistrationInput): Promise<string> {
    if (
      !environment.supabaseAnonKey ||
      environment.supabaseAnonKey === 'PASTE_LOCAL_ANON_KEY_HERE' ||
      environment.supabaseAnonKey === 'YOUR_HOSTED_ANON_KEY'
    ) {
      throw new RegistrationError(
        'Supabase keys are not configured yet. Ask your Lead for the environment anon key.',
      );
    }

    // Cast: the generated types still describe the old 4-argument function.
    const { data, error } = await supabase.rpc(
      'register_attendee' as never,
      {
        p_event_code: input.eventCode.trim().toUpperCase(),
        p_full_name: input.fullName.trim(),
        p_email: input.email.trim().toLowerCase(),
        p_organization: input.organization.trim(),
        p_contact_number: input.contactNumber.trim(),
      } as never,
    );

    if (error) {
      // Contract (docs/CONTRACTS.md): duplicate email raises Postgres code 23505
      if (error.code === '23505' || error.message.includes('23505')) {
        throw new DuplicateRegistrationError();
      }
      throw new RegistrationError(
        friendlyMessage(error.message) ||
          error.message ||
          'Unable to complete registration right now. Please try again.',
      );
    }

    if (!data) {
      throw new RegistrationError('Registration succeeded without returning an attendee ID.');
    }

    return data as unknown as string;
  }
}
