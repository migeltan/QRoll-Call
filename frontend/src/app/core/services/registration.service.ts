// Owner: Role 4 (Registration Form + App Shell).
import { Injectable } from '@angular/core';
// import { supabase } from '../supabase/supabase.client';

export interface RegistrationInput {
  fullName: string;
  email: string;
  organization: string;
  contactNumber: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  /**
   * Registers an attendee and resolves with the new attendee id.
   *
   * TODO(role-4): call the `register_attendee` RPC (see docs/CONTRACTS.md):
   *   const { data, error } = await supabase.rpc('register_attendee', {
   *     p_full_name: input.fullName,
   *     p_email: input.email,
   *     p_organization: input.organization,
   *     p_contact_number: input.contactNumber,
   *   });
   * Postgres error code 23505 means this email is already registered - show a friendly message.
   */
  async register(_input: RegistrationInput): Promise<string> {
    throw new Error('TODO(role-4): implement RegistrationService.register');
  }
}
