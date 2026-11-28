// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  styles: [
    `
      .wrap { max-width: 440px; margin: 24px auto; }
      .card { padding: 24px; }
      .eyebrow { margin-top: 14px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; color: var(--qc-ink-muted); }
      h1 { margin: 6px 0 4px; font-size: 1.75rem; }
      .hint { margin: 0 0 16px; color: var(--qc-ink-muted); }
      form { display: grid; gap: 4px; margin-top: 16px; }
      .qc-alert { margin-bottom: 8px; }
      button[type='submit'] { height: 48px; width: 100%; font-weight: 700; }
    `,
  ],
  template: `
    <div class="wrap">
      <div class="qc-card card">
        <div class="qc-foil-strip" aria-hidden="true"></div>
        <div class="eyebrow qc-mono">STAFF ONLY</div>
        <h1>Staff login</h1>
        <p class="hint">For organizers and check-in staff. Attendees don't need an account.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <mat-error>Enter a valid email.</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <mat-error>Password is required.</mat-error>
            }
          </mat-form-field>
          @if (error()) {
            <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
          }
          <button mat-flat-button type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl('/staff/checkin');
    } catch (e) {
      this.error.set(
        e instanceof Error && e.message === 'NOT_STAFF'
          ? 'This account is not authorized as staff.'
          : 'Invalid email or password.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
