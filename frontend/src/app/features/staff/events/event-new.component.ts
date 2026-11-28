// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StaffNavComponent } from '../staff-nav.component';
import type { EventRow } from './event.model';
import { EventsService } from './events.service';
import { formatPH } from './expiry';
import { MAX_NAMES, parseNames } from './names-parser';

const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

const notInPast = (c: AbstractControl): ValidationErrors | null =>
  !c.value || String(c.value) >= todayLocal() ? null : { past: true };

const wholeNumber = (c: AbstractControl): ValidationErrors | null =>
  c.value === null || c.value === '' || Number.isInteger(Number(c.value)) ? null : { whole: true };

@Component({
  selector: 'app-event-new',
  imports: [ReactiveFormsModule, RouterLink, StaffNavComponent, MatButtonModule, MatFormFieldModule, MatInputModule],
  styles: [
    `
      .page { max-width: 640px; margin: 0 auto; }
      h1 { margin: 0 0 4px; font-size: 1.75rem; }
      .hint { margin: 0 0 16px; color: var(--qc-ink-muted); }
      .card, .done { padding: 24px; }
      form { display: grid; gap: 4px; margin-top: 16px; }
      h2 { margin: 12px 0 2px; font-size: 1.1rem; }
      .sub { margin: 0 0 8px; color: var(--qc-ink-muted); font-size: 0.9375rem; }
      .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
      .qc-alert { margin: 4px 0 8px; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .actions button, .actions a { height: 48px; font-weight: 700; }
      .code { margin: 12px 0; padding: 16px; text-align: center; font-size: 2rem; letter-spacing: 0.08em; border: 2px dashed var(--qc-ink); border-radius: var(--qc-radius-md); background: var(--qc-mint-soft); }
      .skipped { margin: 4px 0 0; padding-left: 18px; font-size: 0.875rem; }
    `,
  ],
  template: `
    <div class="page">
      <app-staff-nav />

      @if (created(); as ev) {
        <div class="qc-card done">
          <div class="qc-foil-strip" aria-hidden="true"></div>
          <div class="qc-mono">EVENT CREATED</div>
          <h1>{{ ev.title }}</h1>
          <p class="hint">Share this code with attendees. They enter it when they register for their QR pass.</p>
          <div class="code qc-mono" aria-label="Event code">{{ ev.code }}</div>
          <p class="hint">
            The code and every QR pass stop working on {{ expiryText(ev) }}.
            @if (ev.restrict_to_list) { Only the {{ ev.allowed_names_count }} listed names can register. }
          </p>
          <div class="actions">
            <a mat-flat-button routerLink="/staff/events">Back to events</a>
            <button mat-stroked-button type="button" (click)="another()">Create another</button>
          </div>
        </div>
      } @else {
        <h1>New event</h1>
        <p class="hint">Attendees need the event code to get a QR pass. The code stops working at the end of the event date.</p>

        <div class="qc-card card">
          <div class="qc-foil-strip" aria-hidden="true"></div>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <mat-form-field appearance="outline">
              <mat-label>Event title</mat-label>
              <input matInput formControlName="title" maxlength="150" />
              @if (form.controls.title.touched && form.controls.title.invalid) {
                <mat-error>Enter a title (at least 3 characters).</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Details (optional)</mat-label>
              <textarea matInput formControlName="details" rows="3" maxlength="2000"></textarea>
              <mat-hint>Venue, schedule, what to bring. This goes in the confirmation email.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Event date</mat-label>
              <input matInput type="date" formControlName="eventDate" [min]="today" />
              @if (form.controls.eventDate.touched && form.controls.eventDate.invalid) {
                <mat-error>{{ form.controls.eventDate.errors?.['past'] ? 'Pick today or a later date.' : 'Pick the event date.' }}</mat-error>
              }
            </mat-form-field>
            @if (dateValue()) {
              <div class="qc-alert qc-alert--warn" role="note">
                The event code and all QR passes expire at the end of {{ dateValue() }} (11:59 PM, Philippine time).
              </div>
            }

            <h2>Who can register</h2>
            <p class="sub">Leave blank to accept anyone with the code.</p>
            <mat-form-field appearance="outline">
              <mat-label>Accepted organizations</mat-label>
              <input matInput formControlName="organizations" />
              <mat-hint>Separate with commas, e.g. Group 9, Student Council</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Maximum attendees</mat-label>
              <input matInput type="number" min="1" formControlName="maxAttendees" />
              <mat-hint>Leave blank for no limit. QR codes stop being issued at this number.</mat-hint>
              @if (form.controls.maxAttendees.touched && form.controls.maxAttendees.invalid) {
                <mat-error>Enter a whole number of 1 or more.</mat-error>
              }
            </mat-form-field>

            <h2>Accepted names (optional)</h2>
            <p class="sub">
              Only these people can register. One per line, with an optional email: Juan Dela Cruz, juan&#64;example.com.
              The number of names also limits how many QR codes are issued.
            </p>
            <div class="row">
              <input #file type="file" accept=".csv,.txt,text/csv,text/plain" hidden (change)="onFile($event)" />
              <button mat-stroked-button type="button" (click)="file.click()">Upload CSV</button>
              @if (namesText()) {
                <button mat-button type="button" (click)="namesText.set('')">Clear list</button>
              }
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Type or paste names</mat-label>
              <textarea matInput rows="5" [value]="namesText()" (input)="namesText.set($any($event.target).value)"></textarea>
            </mat-form-field>
            @if (namesText().trim()) {
              <div class="qc-alert" [class.qc-alert--warn]="parsed().skipped.length" role="status">
                {{ parsed().rows.length }} name{{ parsed().rows.length === 1 ? '' : 's' }} ready
                @if (parsed().duplicates) { · {{ parsed().duplicates }} duplicate{{ parsed().duplicates === 1 ? '' : 's' }} removed }
                @if (parsed().skipped.length) {
                  · {{ parsed().skipped.length }} line{{ parsed().skipped.length === 1 ? '' : 's' }} skipped
                  <ul class="skipped">
                    @for (s of skippedPreview(); track s) { <li>{{ s }}</li> }
                  </ul>
                }
              </div>
            }

            @if (error()) {
              <div class="qc-alert qc-alert--error" role="alert">{{ error() }}</div>
            }
            <div class="actions">
              <button mat-flat-button type="submit" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Create event' }}</button>
              <a mat-stroked-button routerLink="/staff/events">Cancel</a>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class EventNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EventsService);

  readonly today = todayLocal();
  readonly saving = signal(false);
  readonly error = signal('');
  readonly created = signal<EventRow | null>(null);
  readonly namesText = signal('');
  readonly parsed = computed(() => parseNames(this.namesText()));
  readonly skippedPreview = computed(() => this.parsed().skipped.slice(0, 3));

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    details: ['', Validators.maxLength(2000)],
    eventDate: ['', [Validators.required, notInPast]],
    organizations: [''],
    maxAttendees: [null as number | null, [Validators.min(1), Validators.max(100000), wholeNumber]],
  });
  readonly dateValue = toSignal(this.form.controls.eventDate.valueChanges, { initialValue: '' });

  expiryText(e: EventRow): string {
    return formatPH(e.expires_at);
  }

  async onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 1_000_000) {
      this.error.set('That file is too large. Use a CSV under 1 MB.');
      return;
    }
    this.error.set('');
    const text = await file.text();
    const current = this.namesText().trim();
    this.namesText.set(current ? `${current}\n${text}` : text);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const names = this.parsed();
    if (names.rows.length > MAX_NAMES) {
      this.error.set(`Too many names. The limit is ${MAX_NAMES} per event.`);
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      const orgs = [...new Set((v.organizations ?? '').split(/[,;\n]/).map((o) => o.trim()).filter(Boolean))].slice(0, 50);
      const event = await this.service.create({
        title: (v.title ?? '').trim(),
        details: (v.details ?? '').trim(),
        event_date: v.eventDate ?? '',
        accepted_organizations: orgs,
        max_attendees: v.maxAttendees === null || v.maxAttendees === undefined ? null : Number(v.maxAttendees),
        allowed_names: names.rows,
      });
      this.created.set(event);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Could not create the event. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  another() {
    this.form.reset({ title: '', details: '', eventDate: '', organizations: '', maxAttendees: null });
    this.namesText.set('');
    this.error.set('');
    this.created.set(null);
  }
}
