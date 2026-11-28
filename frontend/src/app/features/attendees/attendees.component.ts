// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StaffNavComponent } from '../staff/staff-nav.component';
import type { EventRow } from '../staff/events/event.model';
import { EventsService } from '../staff/events/events.service';
import { Attendee, AttendeesService } from '../../core/services/attendees.service';

@Component({
  selector: 'app-attendees',
  imports: [
    DatePipe,
    StaffNavComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  styles: [
    `
      .page { max-width: 1100px; margin: 0 auto; }
      h1 { margin: 0; font-size: 1.75rem; }
      .summary { margin: 4px 0 16px; color: var(--qc-ink-muted); }
      .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .toolbar mat-form-field { flex: 1 1 240px; }
      .toolbar button { height: 48px; margin-bottom: 22px; }
      .qc-alert { margin-bottom: 12px; }
      .muted { padding: 24px 0; text-align: center; color: var(--qc-ink-muted); }
      .scroll { overflow-x: auto; padding: 4px; }
      table { width: 100%; min-width: 860px; background: transparent; }
      th { font-weight: 700; color: var(--qc-ink); }
      .pill { display: inline-block; white-space: nowrap; padding: 2px 10px; border-radius: 999px; border: 1.5px solid var(--qc-ink); font-size: 0.8125rem; font-weight: 600; }
      .pill.in { background: var(--qc-mint-soft); }
      .pill.reg { background: var(--qc-paper-soft); }
    `,
  ],
  template: `
    <div class="page">
      <app-staff-nav />

      <h1>Attendees</h1>
      <p class="summary qc-mono">{{ checkedIn() }} of {{ byEvent().length }} checked in{{ eventLabel() }}</p>

      <div class="toolbar">
        @if (events().length) {
          <mat-form-field appearance="outline">
            <mat-label>Event</mat-label>
            <mat-select [value]="eventId()" (selectionChange)="eventId.set($event.value)">
              <mat-option value="">All events</mat-option>
              @for (e of events(); track e.id) {
                <mat-option [value]="e.id">{{ e.title }} ({{ e.code }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Search name, email or organization</mat-label>
          <input matInput [value]="query()" (input)="query.set($any($event.target).value)" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="reload()" [disabled]="loading()">Refresh</button>
        <button mat-flat-button type="button" (click)="exportCsv()" [disabled]="!byEvent().length">
          {{ eventId() ? 'Export CSV (this event)' : 'Export CSV (all)' }}
        </button>
      </div>

      @if (error()) {
        <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="muted">Loading attendees…</p>
      } @else if (!byEvent().length && !error()) {
        <p class="muted">{{ eventId() ? 'No one has registered for this event yet.' : 'No attendees have registered yet.' }}</p>
      } @else if (!filtered().length) {
        <p class="muted">No attendees match your search.</p>
      } @else {
        <div class="qc-card scroll">
          <table mat-table [dataSource]="filtered()">
            <ng-container matColumnDef="event">
              <th mat-header-cell *matHeaderCellDef>Event</th>
              <td mat-cell *matCellDef="let r">{{ titleOf(r.event_id) || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="full_name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let r">{{ r.full_name }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let r">{{ r.email }}</td>
            </ng-container>
            <ng-container matColumnDef="organization">
              <th mat-header-cell *matHeaderCellDef>Organization</th>
              <td mat-cell *matCellDef="let r">{{ r.organization }}</td>
            </ng-container>
            <ng-container matColumnDef="contact_number">
              <th mat-header-cell *matHeaderCellDef>Contact</th>
              <td mat-cell *matCellDef="let r">{{ r.contact_number }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="pill" [class.in]="r.status === 'checked_in'" [class.reg]="r.status !== 'checked_in'">{{ r.status === 'checked_in' ? 'Checked In' : 'Registered' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="checked_in_at">
              <th mat-header-cell *matHeaderCellDef>Checked in at</th>
              <td mat-cell *matCellDef="let r">{{ r.checked_in_at ? (r.checked_in_at | date: 'short') : '' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
      }
    </div>
  `,
})
export class AttendeesComponent implements OnInit {
  private readonly service = inject(AttendeesService);
  private readonly eventsService = inject(EventsService);

  readonly columns = ['event', 'full_name', 'email', 'organization', 'contact_number', 'status', 'checked_in_at'];
  readonly rows = signal<Attendee[]>([]);
  readonly events = signal<EventRow[]>([]);
  readonly eventId = signal(''); // '' = all events
  readonly query = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  /** Everyone in the selected event (all events when none is selected). */
  readonly byEvent = computed(() => {
    const id = this.eventId();
    return id ? this.rows().filter((r) => r.event_id === id) : this.rows();
  });

  /** The selected event's attendees, narrowed by the search box. */
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.byEvent();
    return this.byEvent().filter((r) =>
      [r.full_name, r.email, r.organization].some((v) => v.toLowerCase().includes(q)),
    );
  });
  readonly checkedIn = computed(() => this.byEvent().filter((r) => r.status === 'checked_in').length);
  readonly eventLabel = computed(() => {
    const e = this.events().find((x) => x.id === this.eventId());
    return e ? ` · ${e.title}` : '';
  });

  ngOnInit() {
    void this.reload();
  }

  titleOf = (id: string | null | undefined): string => this.events().find((e) => e.id === id)?.title ?? '';

  async reload() {
    this.error.set('');
    this.loading.set(true);
    try {
      this.rows.set(await this.service.list());
    } catch {
      this.error.set('Could not load attendees. Check your connection and press Refresh.');
    } finally {
      this.loading.set(false);
    }
    // The event list is optional: if the events migration isn't applied yet, the page still works.
    try {
      this.events.set(await this.eventsService.list());
    } catch {
      this.events.set([]);
    }
  }

  /** Exports the selected event (or everyone). Ignores the search box so the backup is complete. */
  exportCsv() {
    const csv = this.service.toCsv(this.byEvent(), this.titleOf);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const code = this.events().find((e) => e.id === this.eventId())?.code ?? 'all-events';
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${code}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
