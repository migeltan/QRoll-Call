// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable, signal } from '@angular/core';
// import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** True when a staff member is signed in. */
  readonly isLoggedIn = signal(false);

  /**
   * TODO(role-5): sign in with email + password via supabase.auth.signInWithPassword,
   * restore the session on app start (supabase.auth.getSession / onAuthStateChange),
   * and keep `isLoggedIn` up to date.
   */
  async signIn(_email: string, _password: string): Promise<void> {
    throw new Error('TODO(role-5): implement AuthService.signIn');
  }

  async signOut(): Promise<void> {
    throw new Error('TODO(role-5): implement AuthService.signOut');
  }
}
