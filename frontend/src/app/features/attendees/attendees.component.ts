// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { StaffNavComponent } from '../staff/staff-nav.component';
import { Attendee, AttendeesService } from '../../core/services/attendees.service';

@Component({
  selector: 'app-attendees',
  imports: [DatePipe, StaffNavComponent, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule],
  styles: [
    `
      .page { max-width: 1000px; margin: 0 auto; }
      h1 { margin: 0; font-size: 1.75rem; }
      .summary { margin: 4px 0 16px; color: var(--qc-ink-muted); }
      .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .toolbar mat-form-field { flex: 1 1 240px; }
      .toolbar button { height: 48px; margin-bottom: 22px; }
      .qc-alert { margin-bottom: 12px; }
      .muted { padding: 24px 0; text-align: center; color: var(--qc-ink-muted); }
      .scroll { overflow-x: auto; padding: 4px; }
      table { width: 100%; min-width: 720px; background: transparent; }
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
      <p class="summary qc-mono">{{ checkedIn() }} of {{ rows().length }} checked in</p>

      <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>Search name, email or organization</mat-label>
          <input matInput [value]="query()" (input)="query.set($any($event.target).value)" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="reload()" [disabled]="loading()">Refresh</button>
        <button mat-flat-button type="button" (click)="exportCsv()" [disabled]="!rows().length">
          Export CSV (all)
        </button>
      </div>

      @if (error()) {
        <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="muted">Loading attendees…</p>
      } @else if (!rows().length && !error()) {
        <p class="muted">No attendees have registered yet.</p>
      } @else if (!filtered().length) {
        <p class="muted">No attendees match your search.</p>
      } @else {
        <div class="qc-card scroll">
          <table mat-table [dataSource]="filtered()">
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

  readonly columns = ['full_name', 'email', 'organization', 'contact_number', 'status', 'checked_in_at'];
  readonly rows = signal<Attendee[]>([]);
  readonly query = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter((r) =>
      [r.full_name, r.email, r.organization].some((v) => v.toLowerCase().includes(q)),
    );
  });
  readonly checkedIn = computed(() => this.rows().filter((r) => r.status === 'checked_in').length);

  ngOnInit() {
    void this.reload();
  }

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
  }

  exportCsv() {
    const csv = this.service.toCsv(this.rows());
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}