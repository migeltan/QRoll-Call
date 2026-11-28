// Owner: Role 5 (Staff Auth + Check-in Scanner).
// Small staff bar shared by the check-in and attendees pages (replaces the copy-pasted nav).
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-staff-nav',
  imports: [RouterLink, RouterLinkActive],
  styles: [
    `
      nav { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 20px; }
      a, button {
        padding: 7px 14px; border-radius: 999px; border: 2px solid transparent; background: none;
        color: var(--qc-ink-muted); font: 600 0.9375rem var(--qc-font-body); text-decoration: none; cursor: pointer;
      }
      a:hover, a.is-active { color: var(--qc-ink); background: var(--qc-paper-soft); }
      a.is-active { border-color: var(--qc-ink); }
      button { margin-left: auto; border-color: var(--qc-ink); background: var(--qc-surface); color: var(--qc-ink); }
    `,
  ],
  template: `
    <nav aria-label="Staff navigation">
      <a routerLink="/staff/checkin" routerLinkActive="is-active">Check-in</a>
      <a routerLink="/staff/events" routerLinkActive="is-active">Events</a>
      <a routerLink="/staff/attendees" routerLinkActive="is-active">Attendees</a>
      <button type="button" (click)="logout()">Sign out</button>
    </nav>
  `,
})
export class StaffNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/staff/login');
  }
}
