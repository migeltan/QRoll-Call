// Pre-wired by the Lead. Owner: Role 4.
// Public registration routes live at '' and Role 5's staff routes mount at 'staff'.
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
