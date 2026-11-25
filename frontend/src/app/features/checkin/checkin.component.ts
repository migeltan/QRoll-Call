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
  styles: [
    `
      .page { max-width: 480px; margin: 0 auto; padding: 16px; }
      .nav { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
      .reader { width: 100%; min-height: 80px; border-radius: 8px; overflow: hidden; }
      .notice { margin: 12px 0; padding: 12px; border-radius: 8px; background: #fff3e0; color: #7a4a00; }
      .error { margin: 12px 0; color: #b00020; }
      .busy { margin: 12px 0; font-weight: 500; }
      .result { margin: 16px 0; padding: 16px; border-radius: 8px; color: #fff; }
      .result h3 { margin: 0 0 4px; font-size: 1.4rem; }
      .result p { margin: 2px 0; }
      .ok { background: #2e7d32; }
      .dup { background: #c25e00; }
      .bad { background: #c62828; }
      .result button { margin-top: 12px; }
      .manual { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
      .manual mat-form-field { flex: 1 1 200px; }
    `,
  ],
  template: `
    <div class="page">
      <nav class="nav">
        <a mat-button routerLink="/staff/checkin">Check-in</a>
        <a mat-button routerLink="/staff/attendees">Attendees</a>
        <button mat-button type="button" (click)="logout()">Sign out</button>
      </nav>

      <h2>Check-in</h2>

      @if (offline()) {
        <p class="notice">
          You're offline. Check-ins won't work until the connection is back. Use the exported
          attendee list as a backup.
        </p>
      }

      <div id="qr-reader" class="reader"></div>

      @if (busy()) {
        <p class="busy">Checking…</p>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (result(); as r) {
        <div class="result" [class.ok]="r.status === 'checked_in'" [class.dup]="r.status === 'already_checked_in'" [class.bad]="r.status === 'invalid_token'">
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
          <button mat-stroked-button type="button" style="color: #fff; border-color: #fff" (click)="result.set(null)">
            Scan next
          </button>
        </div>
      }

      <p>No camera? Type the token, or use a USB scanner:</p>
      <form class="manual" (ngSubmit)="submitManual()">
        <mat-form-field>
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
  readonly offline = signal(typeof navigator !== 'undefined' && !navigator.onLine);
  manualToken = '';

  private readonly onOnline = () => this.offline.set(false);
  private readonly onOffline = () => this.offline.set(true);

  async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/staff/login');
  }

  async ngAfterViewInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
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
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    try {
      if (this.scanner?.isScanning) await this.scanner.stop();
    } catch {
      /* ignore */
    }
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
      const res = await this.checkin.checkIn(token);
      this.result.set(res);
      navigator.vibrate?.(res.status === 'checked_in' ? 100 : [100, 80, 100]);
    } catch {
      this.error.set(
        this.offline() ? "You're offline. Try again when the connection is back." : 'Could not reach the server. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}