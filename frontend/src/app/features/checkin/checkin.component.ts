// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { CheckinService } from '../../core/services/checkin.service';
import type { CheckInResult } from '../../core/models/check-in.model';

@Component({
  selector: 'app-checkin',
  imports: [FormsModule, DatePipe, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div style="max-width: 480px; margin: 16px auto; padding: 0 16px">
      <nav style="display: flex; gap: 8px; margin-bottom: 8px">
        <a mat-button routerLink="/staff/checkin">Check-in</a>
        <a mat-button routerLink="/staff/attendees">Attendees</a>
        <button mat-button type="button" (click)="logout()">Sign out</button>
      </nav>

      <h2>Check-in</h2>
      <div id="qr-reader" style="width: 100%"></div>

      @if (error()) {
        <p style="color: #b00020">{{ error() }}</p>
      }

      @if (result(); as r) {
        <div [style.background]="color(r)" style="padding: 16px; border-radius: 8px; margin: 16px 0; color: #fff">
          @switch (r.status) {
            @case ('checked_in') {
              <h3>Checked In</h3>
              <p>{{ r.attendee?.full_name }} · {{ r.attendee?.organization }}</p>
            }
            @case ('already_checked_in') {
              <h3>Already checked in</h3>
              <p>{{ r.attendee?.full_name }} · {{ r.attendee?.organization }}</p>
              <p>First scanned: {{ r.attendee?.checked_in_at | date: 'medium' }}</p>
            }
            @case ('invalid_token') {
              <h3>Invalid QR code</h3>
              <p>No attendee matches this code.</p>
            }
          }
        </div>
      }

      <p>No camera? Type the token, or use a USB scanner:</p>
      <form (ngSubmit)="submitManual()" style="display: flex; gap: 8px">
        <mat-form-field style="flex: 1">
          <mat-label>Token</mat-label>
          <input matInput name="token" [(ngModel)]="manualToken" autocomplete="off" />
        </mat-form-field>
        <button mat-flat-button type="submit" [disabled]="busy()">Check in</button>
      </form>
    </div>
  `,
})
export class CheckinComponent implements AfterViewInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly checkin = inject(CheckinService);
  private scanner?: Html5Qrcode;
  private lastToken = '';
  private lastAt = 0;

  readonly result = signal<CheckInResult | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  manualToken = '';

  async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/staff/login');
  }

  async ngAfterViewInit() {
    this.scanner = new Html5Qrcode('qr-reader');
    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => void this.handle(text),
        () => {},
      );
    } catch {
      this.error.set('Camera unavailable. Allow camera access (HTTPS is required) or use the box below.');
    }
  }

  async ngOnDestroy() {
    try {
      if (this.scanner?.isScanning) await this.scanner.stop();
    } catch {
      /* ignore */
    }
  }

  color(r: CheckInResult) {
    return r.status === 'checked_in' ? '#2e7d32' : r.status === 'already_checked_in' ? '#ed6c02' : '#c62828';
  }

  submitManual() {
    void this.handle(this.manualToken);
    this.manualToken = '';
  }

  private async handle(raw: string) {
    const token = raw.trim();
    const now = Date.now();
    // Ignore empty input and the camera re-reading the same code repeatedly.
    if (!token || this.busy() || (token === this.lastToken && now - this.lastAt < 3000)) return;
    this.lastToken = token;
    this.lastAt = now;
    this.busy.set(true);
    this.error.set('');
    try {
      this.result.set(await this.checkin.checkIn(token));
    } catch {
      this.error.set('Could not reach the server. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}