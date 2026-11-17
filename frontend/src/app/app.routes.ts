// Pre-wired by the Lead. Owner: Role 4.
// Each role works inside its own lazy-loaded route file, so nobody needs to edit this file:
//   - attendees (public)  -> features/register/register.routes.ts   (Role 4)
//   - staff (login, scan, list) -> features/staff/staff.routes.ts    (Role 5)
import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'staff',
        loadChildren: () => import('./features/staff/staff.routes').then((m) => m.STAFF_ROUTES),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/register/register.routes').then((m) => m.REGISTER_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
