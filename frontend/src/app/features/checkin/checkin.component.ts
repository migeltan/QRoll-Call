// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StaffNavComponent } from '../staff/staff-nav.component';
import { CheckinService } from '../../core/services/checkin.service';
import type { CheckInResult } from '../../core/models/check-in.model';

@Component({
  selector: 'app-checkin',
  imports: [FormsModule, DatePipe, StaffNavComponent, MatButtonModule, MatFormFieldModule, MatInputModule],
  styles: [
    `
      .page { max-width: 520px; margin: 0 auto; }
      h1 { margin: 0 0 12px; font-size: 1.75rem; }
      .reader { width: 100%; min-height: 80px; overflow: hidden; border-radius: var(--qc-radius-md); }
      .frame { padding: 8px; margin-bottom: 16px; }
      .qc-alert { margin: 0 0 12px; }
      .busy { margin: 0 0 12px; font-weight: 600; }
      .result { margin: 0 0 16px; padding: 18px; color: var(--qc-ink); }
      .result h2 { margin: 0 0 4px; font-size: 1.5rem; }
      .result p { margin: 2px 0; }
      .result button { margin-top: 12px; background: var(--qc-surface); }
      .ok { background: var(--qc-mint-soft); }
      .dup { background: var(--qc-amber-soft); }
      .bad { background: var(--qc-coral-soft); }
      .manual-card { padding: 16px; }
      .manual-card p { margin: 0 0 8px; color: var(--qc-ink-muted); }
      .manual { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
      .manual mat-form-field { flex: 1 1 200px; }
      .manual button { height: 56px; }
    `,
  ],
  template: `
    <div class="page">
      <app-staff-nav />
      <h1>Check-in</h1>

      @if (offline()) {
        <div class="qc-alert qc-alert--warn" role="alert">
          You're offline. Check-ins won't work until the connection is back. Use the exported
          attendee list as a backup.
        </div>
      }

      @if (busy()) {
        <p class="busy" aria-live="polite">Checking…</p>
      }
      @if (error()) {
        <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
      }

      <!-- Result sits above the camera so staff never miss it on a phone. -->
      @if (result(); as r) {
        <div
          class="qc-card result"
          role="status"
          [class.ok]="r.status === 'checked_in'"
          [class.dup]="r.status === 'already_checked_in'"
          [class.bad]="r.status === 'invalid_token'"
        >
          @switch (r.status) {
            @case ('checked_in') {
              <h2>Checked In</h2>
              <p>{{ r.attendee?.full_name }} · {{ r.attendee?.organization }}</p>
            }
            @case ('already_checked_in') {
              <h2>Already checked in</h2>
              <p>{{ r.attendee?.full_name }} · {{ r.attendee?.organization }}</p>
              <p>First scanned: {{ r.attendee?.checked_in_at | date: 'medium' }}</p>
            }
            @case ('invalid_token') {
              <h2>Invalid QR code</h2>
              <p>No attendee matches this code.</p>
            }
          }
          <button mat-stroked-button type="button" (click)="result.set(null)">Scan next</button>
        </div>
      }

      <div class="qc-card frame">
        <div id="qr-reader" class="reader"></div>
      </div>

      <div class="qc-card manual-card">
        <p>No camera? Type the token, or use a USB scanner.</p>
        <form class="manual" (ngSubmit)="submitManual()">
          <mat-form-field appearance="outline">
            <mat-label>Token</mat-label>
            <input matInput name="token" [(ngModel)]="manualToken" autocomplete="off" />
          </mat-form-field>
          <button mat-flat-button type="submit" [disabled]="busy()">Check in</button>
        </form>
      </div>
    </div>
  `,
})
export class CheckinComponent implements AfterViewInit, OnDestroy {
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

  async ngAfterViewInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    this.scanner = new Html5Qrcode('qr-reader');
    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w, h) => {
            const side = Math.floor(Math.min(w, h) * 0.7);
            return { width: side, height: side };
          },
        },
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