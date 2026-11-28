// App shell: friendly sticky header, page container, and footer.
// Owner: Role 4 (Registration Form + App Shell).
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <header class="shell-header">
      <div class="shell-header__inner">
        <a routerLink="/" class="brand" aria-label="QRoll Call home">
          <!-- Inline SVG mark keeps rendering crisp even offline on event day -->
          <span class="brand__mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="#f97066" />
            </svg>
          </span>
          <span class="brand__text">
            <strong>QRoll Call</strong>
            <span class="brand__pill qc-mono">PASS</span>
          </span>
        </a>

        <nav class="shell-nav" aria-label="Primary navigation">
          <a
            routerLink="/"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            Get Pass
          </a>
          <a routerLink="/" fragment="how-it-works" class="nav-link">How It Works</a>
          <!-- Secondary Staff CTA routes into Role 5's /staff/login or /staff/checkin -->
          <a
            [routerLink]="auth.isLoggedIn() ? '/staff/checkin' : '/staff/login'"
            routerLinkActive="is-active"
            class="nav-staff"
          >
            {{ auth.isLoggedIn() ? 'Check-in Desk' : 'Staff Sign In' }}
          </a>
        </nav>
      </div>
    </header>

    <main id="main-content" class="shell-main">
      <router-outlet />
    </main>

    <footer class="shell-footer">
      <div class="shell-footer__inner">
        <span>QRoll Call · One pass, one smooth scan</span>
        <a [routerLink]="auth.isLoggedIn() ? '/staff/checkin' : '/staff/login'">
          Organizer &amp; Staff Portal →
        </a>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      min-height: 100dvh;
      flex-direction: column;
    }

    .skip-link {
      position: absolute;
      left: -9999px;
      top: 8px;
      z-index: 50;
      padding: 8px 14px;
      background: var(--qc-ink);
      color: #fff;
      border-radius: 10px;
      text-decoration: none;
      &:focus {
        left: 12px;
      }
    }

    .shell-header {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(250, 247, 242, 0.94);
      backdrop-filter: blur(8px);
      border-bottom: 2px solid var(--qc-ink);
    }

    .shell-header__inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--qc-ink);
      text-decoration: none;
    }

    .brand__mark {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      background: var(--qc-ink);
      color: var(--qc-paper);
    }

    .brand__text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--qc-font-display);
      font-size: 1.15rem;
    }

    .brand__pill {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--qc-peach-soft);
      border: 1.5px solid var(--qc-ink);
      color: var(--qc-ink);
    }

    .shell-nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .nav-link {
      padding: 7px 13px;
      border-radius: 999px;
      color: var(--qc-ink-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9375rem;
      &:hover,
      &.is-active {
        color: var(--qc-ink);
        background: var(--qc-paper-soft);
      }
    }

    .nav-staff {
      padding: 7px 14px;
      border-radius: 999px;
      border: 2px solid var(--qc-ink);
      background: var(--qc-surface);
      color: var(--qc-ink);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 2px 2px 0 var(--qc-ink);
      transition: transform 120ms ease, box-shadow 120ms ease;
      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--qc-ink);
      }
    }

    .shell-main {
      flex: 1;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 28px 16px 48px;
    }

    .shell-footer {
      border-top: 2px solid var(--qc-ink);
      background: var(--qc-surface);
    }

    .shell-footer__inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--qc-ink-muted);
      a {
        color: var(--qc-ink);
        font-weight: 600;
        text-decoration: none;
      }
    }
  `,
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
}
