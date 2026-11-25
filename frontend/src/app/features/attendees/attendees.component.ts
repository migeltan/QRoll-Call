// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth/auth.service';
import { Attendee, AttendeesService } from '../../core/services/attendees.service';

@Component({
  selector: 'app-attendees',
  imports: [DatePipe, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule],
  styles: [
    `
      .page { max-width: 1000px; margin: 0 auto; padding: 16px; }
      .nav { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
      .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .toolbar mat-form-field { flex: 1 1 240px; }
      .scroll { overflow-x: auto; }
      table { width: 100%; min-width: 720px; }
      .error { color: #b00020; }
      .muted { color: #666; padding: 24px 0; text-align: center; }
    `,
  ],
  template: `
    <div class="page">
      <nav class="nav">
        <a mat-button routerLink="/staff/checkin">Check-in</a>
        <a mat-button routerLink="/staff/attendees">Attendees</a>
        <button mat-button type="button" (click)="logout()">Sign out</button>
      </nav>

      <h2>Attendees</h2>
      <p>{{ checkedIn() }} of {{ rows().length }} checked in</p>

      <div class="toolbar">
        <mat-form-field>
          <mat-label>Search name, email or organization</mat-label>
          <input matInput [value]="query()" (input)="query.set($any($event.target).value)" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="reload()" [disabled]="loading()">Refresh</button>
        <button mat-flat-button type="button" (click)="exportCsv()" [disabled]="!rows().length">
          Export CSV
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="muted">Loading attendees…</p>
      } @else if (!rows().length && !error()) {
        <p class="muted">No attendees have registered yet.</p>
      } @else if (!filtered().length) {
        <p class="muted">No attendees match your search.</p>
      } @else {
        <div class="scroll">
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
              <td mat-cell *matCellDef="let r">{{ r.status === 'checked_in' ? 'Checked In' : 'Registered' }}</td>
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
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

  async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/staff/login');
  }

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
    URL.revokeObjectURL(url);
  }
}