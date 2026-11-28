// Handles public attendee registration via the `register_attendee` Supabase RPC.
// Owner: Role 4 (Registration Form + App Shell).
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { supabase } from '../supabase/supabase.client';

export interface RegistrationInput {
  fullName: string;
  email: string;
  organization: string;
  contactNumber: string;
}

/** Raised when Postgres unique index reports duplicate email (SQLSTATE 23505). */
export class DuplicateRegistrationError extends Error {
  constructor(message = 'This email address is already registered.') {
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

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  /**
   * Calls `register_attendee(p_full_name, p_email, p_organization, p_contact_number)`
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

    const { data, error } = await supabase.rpc('register_attendee', {
      p_full_name: input.fullName.trim(),
      p_email: input.email.trim().toLowerCase(),
      p_organization: input.organization.trim(),
      p_contact_number: input.contactNumber.trim(),
    });

    if (error) {
      // Contract (docs/CONTRACTS.md): duplicate email raises Postgres code 23505
      if (error.code === '23505' || error.message.includes('23505')) {
        throw new DuplicateRegistrationError();
      }
      throw new RegistrationError(
        error.message || 'Unable to complete registration right now. Please try again.',
      );
    }

    if (!data) {
      throw new RegistrationError('Registration succeeded without returning an attendee ID.');
    }

    return data;
  }
}
