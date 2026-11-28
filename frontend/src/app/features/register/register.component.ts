// Public landing + reactive registration form + live cute ticket stub preview.
// Owner: Role 4 (Registration Form + App Shell).
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DuplicateRegistrationError,
  RegistrationService,
} from '../../core/services/registration.service';
import { TicketStubComponent } from '../../shared/ticket/ticket-stub.component';

export interface RegisteredState {
  attendeeId: string;
  fullName: string;
  email: string;
  organization: string;
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TicketStubComponent,
  ],
  template: `
    <section class="qc-hero-grid" aria-labelledby="register-heading">
      <!-- Left column: Friendly intro + Signature Live Ticket Stub -->
      <div class="intro-column">
        <div class="eyebrow qc-mono">
          <span class="eyebrow__dot" aria-hidden="true"></span>
          PAPERLESS ENTRY · NO ACCOUNT NEEDED
        </div>

        <h1 id="register-heading" class="hero-title">
          Grab your pass.<br />Scan in at the door.
        </h1>

        <p class="hero-copy">
          Fill in your details once and we'll email your personal QR ticket straight to your inbox.
          Zero paper lists, zero app downloads.
        </p>

        <app-ticket-stub
          [name]="formValue().fullName ?? ''"
          [org]="formValue().organization ?? ''"
          [email]="formValue().email ?? ''"
          [ready]="formReady()"
        />
      </div>

      <!-- Right column: Reactive Registration Form -->
      <div class="qc-card form-card">
        <div class="form-head">
          <h2>Get Your QR Ticket</h2>
          <p class="muted-copy">Takes under 30 seconds — all fields are required.</p>
        </div>

        @if (duplicateEmailError()) {
          <div class="qc-alert qc-alert--warn" role="alert">
            <div>
              <strong>Already on the list</strong>
              <p class="muted-copy">
                {{ duplicateEmailError() }} Check your inbox (and spam folder) for your QR ticket,
                or try another email.
              </p>
            </div>
          </div>
        }

        @if (genericError()) {
          <div class="qc-alert qc-alert--error" role="alert">
            <div>
              <strong>Couldn't complete registration</strong>
              <p class="muted-copy">{{ genericError() }}</p>
            </div>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="reg-form" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input
              matInput
              formControlName="fullName"
              autocomplete="name"
              placeholder="e.g. Alex Rivera"
            />
            @if (form.controls.fullName.hasError('required')) {
              <mat-error>Full name is required.</mat-error>
            } @else if (form.controls.fullName.hasError('minlength')) {
              <mat-error>Enter at least 2 characters.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email Address</mat-label>
            <input
              matInput
              type="email"
              inputmode="email"
              formControlName="email"
              autocomplete="email"
              placeholder="alex@organization.org"
            />
            <mat-hint>Your QR pass arrives here right after you submit.</mat-hint>
            @if (form.controls.email.hasError('required')) {
              <mat-error>Email address is required.</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>Enter a valid email address.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Organization</mat-label>
            <input
              matInput
              formControlName="organization"
              autocomplete="organization"
              placeholder="School, company, or community"
            />
            @if (form.controls.organization.hasError('required')) {
              <mat-error>Organization is required.</mat-error>
            } @else if (form.controls.organization.hasError('minlength')) {
              <mat-error>Enter at least 2 characters.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contact Number</mat-label>
            <input
              matInput
              type="tel"
              inputmode="tel"
              formControlName="contactNumber"
              autocomplete="tel"
              placeholder="+63 917 555 0142"
            />
            @if (form.controls.contactNumber.hasError('required')) {
              <mat-error>Contact number is required.</mat-error>
            } @else if (form.controls.contactNumber.hasError('pattern')) {
              <mat-error>Enter a valid phone number (7–20 digits).</mat-error>
            }
          </mat-form-field>

          <button mat-flat-button type="submit" class="submit-btn" [disabled]="submitting()">
            @if (submitting()) {
              <span class="submit-btn__inner">
                <mat-spinner diameter="18" />
                Issuing Your Pass...
              </span>
            } @else {
              Issue My QR Pass →
            }
          </button>
        </form>
      </div>
    </section>

    <!-- How It Works + Clear Staff Handoff -->
    <section id="how-it-works" class="how-section" aria-labelledby="how-heading">
      <div>
        <h2 id="how-heading" class="section-title">How QRoll Call works</h2>
        <p class="muted-copy">Three quick steps from sign-up to door scan.</p>
      </div>

      <div class="qc-steps-grid">
        <article class="qc-card step-card">
          <span class="step-pill qc-mono">01 · REGISTER</span>
          <h3>Fill out your pass</h3>
          <p class="muted-copy">
            Enter your name, email, organization, and mobile number — no account or password needed.
          </p>
        </article>

        <article class="qc-card step-card">
          <span class="step-pill step-pill--peach qc-mono">02 · EMAIL QR</span>
          <h3>Get your unique ticket</h3>
          <p class="muted-copy">
            We generate a one-of-a-kind QR code and send it straight to your email inbox.
          </p>
        </article>

        <article class="qc-card step-card">
          <span class="step-pill step-pill--mint qc-mono">03 · CHECK IN</span>
          <h3>Scan at the entrance</h3>
          <p class="muted-copy">
            Door staff scan your QR once to mark you Checked In with instant duplicate protection.
          </p>
        </article>
      </div>

      <div class="staff-callout qc-card">
        <div>
          <strong>Helping run the check-in desk?</strong>
          <p class="muted-copy">
            Attendees don't sign in. Staff &amp; organizers log in to scan tickets and view the roster.
          </p>
        </div>
        <a routerLink="/staff/login" class="staff-callout__btn">Staff Sign In →</a>
      </div>
    </section>
  `,
  styles: `
    .intro-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      padding: 5px 12px;
      border-radius: 999px;
      background: var(--qc-surface);
      border: 1.5px solid var(--qc-ink);
      font-size: 0.72rem;
      font-weight: 600;
    }

    .eyebrow__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--qc-peach);
    }

    .hero-title {
      margin: 0;
      font-size: clamp(2.1rem, 4.4vw, 2.9rem);
      line-height: 1.06;
    }

    .hero-copy,
    .muted-copy {
      margin: 0;
      color: var(--qc-ink-muted);
      font-size: 0.9375rem;
    }

    .form-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-head h2,
    .section-title {
      margin: 0 0 4px;
      font-size: 1.375rem;
    }

    .reg-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .submit-btn {
      height: 50px;
      margin-top: 6px;
      font-size: 1rem;
      font-weight: 700;
    }

    .submit-btn__inner {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .how-section {
      margin-top: 46px;
      display: grid;
      gap: 20px;
    }

    .step-card {
      padding: 20px;
      h3 {
        margin: 12px 0 6px;
        font-size: 1.125rem;
      }
    }

    .step-pill {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1.5px solid var(--qc-ink);
      background: var(--qc-primary-soft);
      font-size: 0.72rem;
      font-weight: 600;

      &--peach {
        background: var(--qc-peach-soft);
      }
      &--mint {
        background: var(--qc-mint-soft);
      }
    }

    .staff-callout {
      padding: 18px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .staff-callout__btn {
      padding: 10px 18px;
      border-radius: 999px;
      border: 2px solid var(--qc-ink);
      background: var(--qc-peach-soft);
      color: var(--qc-ink);
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 2px 2px 0 var(--qc-ink);
    }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly registrationService = inject(RegistrationService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    organization: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    contactNumber: [
      '',
      [Validators.required, Validators.pattern(/^[+\d][\d\s\-().]{6,19}$/)],
    ],
  });

  protected readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly submitting = signal(false);
  protected readonly duplicateEmailError = signal<string | null>(null);
  protected readonly genericError = signal<string | null>(null);

  protected readonly formReady = computed(() => this.formStatus() === 'VALID');

  protected async onSubmit(): Promise<void> {
    this.duplicateEmailError.set(null);
    this.genericError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const input = this.form.getRawValue();
    this.submitting.set(true);

    try {
      const attendeeId = await this.registrationService.register(input);
      const state: RegisteredState = {
        attendeeId,
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        organization: input.organization.trim(),
      };
      await this.router.navigate(['/registered'], { state });
    } catch (err) {
      if (err instanceof DuplicateRegistrationError) {
        this.duplicateEmailError.set(err.message);
      } else if (err instanceof Error) {
        this.genericError.set(err.message);
      } else {
        this.genericError.set('Something went wrong while registering. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
