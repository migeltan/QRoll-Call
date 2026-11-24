// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** True when a staff member is signed in. */
  readonly isLoggedIn = signal(false);
  /** Resolves once the saved session has been checked on app start. */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = supabase.auth
      .getSession()
      .then(({ data }) => this.update(!!data.session));

    supabase.auth.onAuthStateChange((_event, session) => {
      // Deferred on purpose: don't call Supabase directly inside this callback.
      setTimeout(() => void this.update(!!session), 0);
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!(await this.isStaff())) {
      await supabase.auth.signOut();
      this.isLoggedIn.set(false);
      throw new Error('NOT_STAFF');
    }
    this.isLoggedIn.set(true);
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.isLoggedIn.set(false);
  }

  private async update(hasSession: boolean): Promise<void> {
    this.isLoggedIn.set(hasSession ? await this.isStaff() : false);
  }

  private async isStaff(): Promise<boolean> {
    // TODO(role-5): remove this comment once database.types.ts includes is_staff
    // @ts-expect-error is_staff is not in the generated types yet
    const { data, error } = await supabase.rpc('is_staff');
    return !error && data === true;
  }
}