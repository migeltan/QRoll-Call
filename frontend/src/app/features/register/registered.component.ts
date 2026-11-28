// Post-registration confirmation screen featuring the issued torn-stub pass.
// Owner: Role 4 (Registration Form + App Shell).
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TicketStubComponent } from '../../shared/ticket/ticket-stub.component';
import { formatPH } from '../../shared/expiry';
import type { RegisteredState } from './register.component';

function readRegisteredState(raw: unknown): RegisteredState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (
    typeof record['attendeeId'] === 'string' &&
    typeof record['fullName'] === 'string' &&
    typeof record['email'] === 'string' &&
    typeof record['organization'] === 'string'
  ) {
    return {
      attendeeId: record['attendeeId'],
      fullName: record['fullName'],
      email: record['email'],
      organization: record['organization'],
      eventTitle: typeof record['eventTitle'] === 'string' ? record['eventTitle'] : undefined,
      expiresAt: typeof record['expiresAt'] === 'string' ? record['expiresAt'] : undefined,
    };
  }
  return null;
}

@Component({
  selector: 'app-registered',
  imports: [RouterLink, MatButtonModule, TicketStubComponent],
  template: `
    <section class="confirm-wrap" aria-labelledby="registered-heading">
      <div class="confirm-head">
        <span class="status-pill qc-mono">YOU'RE ON THE LIST</span>
        <h1 id="registered-heading">Check your inbox for your QR pass!</h1>
        <p>
          Your registration is confirmed and your unique ticket email is on its way.
        </p>
        @if (state?.eventTitle) {
          <p><strong>{{ state?.eventTitle }}</strong></p>
        }
      </div>

      @if (state) {
        <app-ticket-stub
          [name]="state.fullName"
          [org]="state.organization"
          [email]="state.email"
          [refCode]="state.attendeeId"
          [ready]="true"
          [torn]="true"
        />
      } @else {
        <div class="qc-alert qc-alert--success">
          <span>
            Your registration was recorded. Check your email inbox for your official QR ticket.
          </span>
        </div>
      }

      <div class="qc-card next-card">
        <h2>Quick reminders for event day</h2>
        <ul>
          <li>Check your inbox (and spam/promotions folder) if you don't see it within a minute.</li>
          <li>Save a screenshot of the QR code so it loads cleanly even on spotty venue Wi-Fi.</li>
          <li>Each pass validates once — show it to check-in staff at the entrance.</li>
          @if (validUntil) {
            <li>Your pass is only valid until {{ validUntil }} (Philippine time). After that it won't be accepted.</li>
          }
        </ul>

        <div class="confirm-actions">
          <a mat-flat-button routerLink="/">Register Another Attendee</a>
          <a mat-stroked-button routerLink="/staff/login">Staff Sign In</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .confirm-wrap {
      max-width: 640px;
      margin: 8px auto;
      display: grid;
      gap: 20px;
    }

    .confirm-head h1 {
      margin: 10px 0 6px;
      font-size: clamp(1.85rem, 3.8vw, 2.35rem);
      line-height: 1.08;
    }

    .confirm-head p {
      margin: 0;
      color: var(--qc-ink-muted);
    }

    .status-pill {
      display: inline-block;
      padding: 4px 11px;
      border-radius: 999px;
      border: 1.5px solid var(--qc-ink);
      font-size: 0.72rem;
      font-weight: 600;
      background: var(--qc-mint-soft);
      color: #065f46;
    }

    .next-card {
      padding: 22px;
      display: grid;
      gap: 14px;

      h2 {
        margin: 0;
        font-size: 1.125rem;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        color: var(--qc-ink-muted);
        display: grid;
        gap: 6px;
      }
    }

    .confirm-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
    }
  `,
})
export class RegisteredComponent {
  private readonly router = inject(Router);
  protected readonly state = readRegisteredState(
    this.router.currentNavigation()?.extras.state ??
      this.router.lastSuccessfulNavigation()?.extras.state ??
      (typeof window !== 'undefined' ? window.history.state : undefined),
  );
  protected readonly validUntil = this.state?.expiresAt ? formatPH(this.state.expiresAt) : null;
}
