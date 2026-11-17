// App shell: toolbar + page container. Owner: Role 4.
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <a routerLink="/" class="brand">QRoll Call</a>
    </mat-toolbar>
    <main class="page">
      <router-outlet />
    </main>
  `,
  styles: `
    .brand {
      color: inherit;
      text-decoration: none;
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px;
    }
  `,
})
export class LayoutComponent {}
