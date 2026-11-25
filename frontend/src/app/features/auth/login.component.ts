// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  styles: [
    `
      mat-card { max-width: 400px; margin: 32px 16px; padding: 16px; }
      @media (min-width: 440px) { mat-card { margin: 48px auto; } }
      form { display: grid; gap: 8px; margin-top: 16px; }
      .hint { margin: 4px 0 0; color: #666; }
      .error { margin: 0; color: #b00020; }
    `,
  ],
  template: `
    <mat-card>
      <mat-card-title>Staff login</mat-card-title>
      <p class="hint">For organizers and check-in staff only.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button mat-flat-button type="submit" [disabled]="loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </mat-card>
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