// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { StaffNavComponent } from '../staff-nav.component';
import type { EventRow } from './event.model';
import { EventsService } from './events.service';
import { describeExpiry, formatPH } from './expiry';

@Component({
  selector: 'app-events',
  imports: [RouterLink, StaffNavComponent, MatButtonModule],
  styles: [
    `
      .page { max-width: 1000px; margin: 0 auto; }
      .head { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
      h1 { margin: 0; font-size: 1.75rem; }
      .summary { margin: 4px 0 0; color: var(--qc-ink-muted); }
      .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
      .ev { padding: 18px; display: grid; gap: 8px; align-content: start; }
      .ev h2 { margin: 0; font-size: 1.2rem; }
      .meta { margin: 0; color: var(--qc-ink-muted); font-size: 0.9375rem; }
      .code { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .code strong { font-size: 1.1rem; letter-spacing: 0.06em; }
      .pill { display: inline-block; width: fit-content; white-space: nowrap; padding: 2px 10px; border-radius: 999px; border: 1.5px solid var(--qc-ink); font-size: 0.8125rem; font-weight: 600; }
      .open { background: var(--qc-mint-soft); }
      .closed { background: var(--qc-coral-soft); }
      .full { background: var(--qc-amber-soft); }
      .soon { background: var(--qc-amber-soft); }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .chips span { padding: 1px 8px; border-radius: 999px; border: 1.5px solid var(--qc-border); background: var(--qc-paper-soft); font-size: 0.8125rem; }
      .qc-alert { margin-bottom: 12px; }
      .muted { padding: 24px 0; text-align: center; color: var(--qc-ink-muted); }
    `,
  ],
  template: `
    <div class="page">
      <app-staff-nav />

      <div class="head">
        <div>
          <h1>Events</h1>
          <p class="summary qc-mono">{{ rows().length }} event{{ rows().length === 1 ? '' : 's' }}</p>
        </div>
        <div>
          <button mat-stroked-button type="button" (click)="reload()" [disabled]="loading()">Refresh</button>
          <a mat-flat-button routerLink="/staff/events/new">New event</a>
        </div>
      </div>

      @if (error()) {
        <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="muted">Loading events…</p>
      } @else if (!rows().length && !error()) {
        <p class="muted">No events yet. Create one so attendees can register for it.</p>
      } @else {
        <div class="grid">
          @for (e of rows(); track e.id) {
            <article class="qc-card ev">
              <span class="pill" [class]="status(e).cls">{{ status(e).label }}</span>
              <h2>{{ e.title }}</h2>
              <div class="code">
                <strong class="qc-mono">{{ e.code }}</strong>
                <button mat-stroked-button type="button" (click)="copy(e.code)">
                  {{ copied() === e.code ? 'Copied' : 'Copy code' }}
                </button>
              </div>
              <p class="meta">{{ e.event_date }} · pass valid until {{ when(e) }}</p>
              <p class="meta">{{ e.registered_count }} registered{{ limitText(e) }}</p>
              @if (e.accepted_organizations.length) {
                <div class="chips" aria-label="Accepted organizations">
                  @for (o of e.accepted_organizations; track o) {
                    <span>{{ o }}</span>
                  }
                </div>
              }
              @if (e.restrict_to_list) {
                <p class="meta">Only {{ e.allowed_names_count }} listed names can register.</p>
              }
              @if (e.details) {
                <p class="meta">{{ e.details }}</p>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class EventsComponent implements OnInit {
  private readonly service = inject(EventsService);

  readonly rows = signal<EventRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly copied = signal('');

  ngOnInit() {
    void this.reload();
  }

  async reload() {
    this.error.set('');
    this.loading.set(true);
    try {
      this.rows.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Could not load events. Press Refresh.');
    } finally {
      this.loading.set(false);
    }
  }

  when(e: EventRow): string {
    return formatPH(e.expires_at);
  }

  private limit(e: EventRow): number | null {
    return e.max_attendees ?? (e.restrict_to_list ? e.allowed_names_count : null);
  }

  limitText(e: EventRow): string {
    const l = this.limit(e);
    return l === null ? '' : ` of ${l}`;
  }

  status(e: EventRow): { label: string; cls: string } {
    if (describeExpiry(e.expires_at).level === 'expired') return { label: 'Closed', cls: 'pill closed' };
    const l = this.limit(e);
    if (l !== null && e.registered_count >= l) return { label: 'Full', cls: 'pill full' };
    return { label: 'Open', cls: 'pill open' };
  }

  async copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(code);
      setTimeout(() => this.copied.set(''), 1500);
    } catch {
      /* clipboard unavailable: staff can still select the code by hand */
    }
  }
}
