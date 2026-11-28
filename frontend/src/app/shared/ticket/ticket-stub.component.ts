// Cute tactile QR ticket stub preview with deterministic 21x21 matrix & torn-stub state.
// Owner: Role 4 (Registration Form + App Shell).
import { Component, computed, input, signal } from '@angular/core';

function fnv1a(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

@Component({
  selector: 'app-ticket-stub',
  template: `
    <article
      class="qc-card ticket-card"
      [class.is-torn]="torn()"
      aria-live="polite"
    >
      <div class="qc-foil-strip" aria-hidden="true"></div>

      <div class="ticket-head">
        <span class="badge qc-mono" [class.badge--ready]="ready() || torn()">
          {{ torn() ? 'PASS ISSUED' : ready() ? 'READY TO ISSUE' : 'LIVE PASS PREVIEW' }}
        </span>
        @if (!torn()) {
          <button
            type="button"
            class="flip-btn qc-mono"
            (click)="showGuide.update((v) => !v)"
            [attr.aria-pressed]="showGuide()"
          >
            {{ showGuide() ? 'Front ↺' : 'Door tip ↻' }}
          </button>
        }
      </div>

      @if (!showGuide()) {
        <div class="ticket-split">
          <div class="ticket-info">
            <div>
              <span class="lbl qc-mono">ATTENDEE</span>
              <div class="who" [class.is-empty]="!name().trim()">
                {{ name().trim() || 'Your name here' }}
              </div>
            </div>
            <div>
              <span class="lbl qc-mono">ORGANIZATION</span>
              <div class="meta" [class.is-empty]="!org().trim()">
                {{ org().trim() || 'Team, school, or org' }}
              </div>
            </div>
            <div>
              <span class="lbl qc-mono">DELIVERY EMAIL</span>
              <div class="meta qc-mono" [class.is-empty]="!email().trim()">
                {{ email().trim() || 'you@example.com' }}
              </div>
            </div>
          </div>

          <!-- Detachable stub with crisp 21x21 decorative QR pattern (not a real token) -->
          <div class="stub" aria-hidden="true">
            <svg viewBox="0 0 21 21" shape-rendering="crispEdges">
              @for (cell of qrCells(); track $index) {
                <rect [attr.x]="cell[0]" [attr.y]="cell[1]" width="1" height="1" rx="0.15" />
              }
            </svg>
            <span class="stub-tag qc-mono">{{ torn() ? 'EMAILED' : 'PREVIEW' }}</span>
          </div>
        </div>
      } @else {
        <div class="guide">
          <p class="guide__title">How your pass works at the door</p>
          <ol>
            <li>Watch your inbox (and spam folder) for your official QR ticket email.</li>
            <li>Screenshot the QR so it opens fast even with weak venue Wi-Fi.</li>
            <li>Show it once at the entrance — duplicate scans are automatically flagged.</li>
          </ol>
        </div>
      }

      <div class="qc-perforation" aria-hidden="true"></div>

      <div class="ticket-foot qc-mono">
        <span>PASS · {{ passCode() }}</span>
        <span>{{ torn() ? 'CHECK YOUR INBOX' : 'ADMIT ONE · QR EMAILED' }}</span>
      </div>
    </article>
  `,
  styles: `
    .ticket-card {
      padding: 18px 20px;
      overflow: hidden;
    }

    .ticket-head,
    .ticket-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .ticket-head {
      margin-top: 12px;
    }

    .badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--qc-primary-soft);
      border: 1.5px solid var(--qc-ink);

      &--ready {
        background: var(--qc-mint-soft);
        color: #065f46;
      }
    }

    .flip-btn {
      background: var(--qc-paper);
      border: 1.5px solid var(--qc-ink);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--qc-ink);
      &:hover {
        background: var(--qc-paper-soft);
      }
    }

    .ticket-split {
      margin-top: 16px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 128px;
      gap: 16px;
      align-items: center;
    }

    .ticket-info {
      display: grid;
      gap: 10px;
      min-width: 0;
    }

    .lbl {
      display: block;
      font-size: 0.66rem;
      color: var(--qc-ink-muted);
    }

    .who {
      font-family: var(--qc-font-display);
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.12;
      overflow-wrap: anywhere;
    }

    .meta {
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }

    .is-empty {
      color: #8c857b;
    }

    .stub {
      padding: 10px;
      border-radius: 14px;
      border: 2px dashed var(--qc-ink);
      background: var(--qc-paper);
      display: grid;
      place-items: center;
      gap: 6px;
      transform-origin: bottom left;
      transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);

      svg {
        width: 100%;
        max-width: 98px;
        fill: var(--qc-ink);
      }
    }

    .is-torn .stub {
      transform: translate(8px, 6px) rotate(6deg);
      background: var(--qc-mint-soft);
    }

    .stub-tag {
      font-size: 0.62rem;
      font-weight: 600;
      color: var(--qc-ink-muted);
    }

    .guide {
      margin-top: 14px;
      font-size: 0.92rem;
      color: var(--qc-ink-muted);

      ol {
        margin: 8px 0 0;
        padding-left: 18px;
        display: grid;
        gap: 6px;
      }
    }

    .guide__title {
      margin: 0;
      color: var(--qc-ink);
      font-weight: 700;
    }

    .ticket-foot {
      font-size: 0.7rem;
      color: var(--qc-ink-muted);
    }

    @media (max-width: 440px) {
      .ticket-split {
        grid-template-columns: 1fr 104px;
      }
    }
  `,
})
export class TicketStubComponent {
  readonly name = input('');
  readonly org = input('');
  readonly email = input('');
  readonly ready = input(false);
  readonly torn = input(false);
  readonly refCode = input('');

  protected readonly showGuide = signal(false);

  protected readonly passCode = computed(() => {
    if (this.refCode()) {
      return this.refCode().slice(0, 8).toUpperCase();
    }
    const seed = `${this.name()}|${this.email()}|qroll`;
    return fnv1a(seed).toString(16).toUpperCase().padStart(8, '0');
  });

  // Builds a 21x21 QR-inspired SVG pattern with standard 7x7 corner finder squares
  protected readonly qrCells = computed(() => {
    const rand = mulberry32(fnv1a(`${this.name()}|${this.org()}|${this.email() || 'qroll'}`));
    const cells: [number, number][] = [];
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);

    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        if (!inFinder(x, y) && rand() > 0.5) {
          cells.push([x, y]);
        }
      }
    }

    for (const [ox, oy] of [
      [0, 0],
      [14, 0],
      [0, 14],
    ]) {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const edge = i === 0 || j === 0 || i === 6 || j === 6;
          const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          if (edge || core) {
            cells.push([ox + i, oy + j]);
          }
        }
      }
    }

    return cells;
  });
}
