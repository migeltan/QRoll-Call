// Staff-only routes, mounted at /staff by app.routes.ts. Owner: Role 5.
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const STAFF_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'checkin',
    canActivate: [authGuard],
    loadComponent: () => import('../checkin/checkin.component').then((m) => m.CheckinComponent),
  },
  {
    path: 'attendees',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../attendees/attendees.component').then((m) => m.AttendeesComponent),
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./events/events.component').then((m) => m.EventsComponent),
  },
  {
    path: 'events/new',
    canActivate: [authGuard],
    loadComponent: () => import('./events/event-new.component').then((m) => m.EventNewComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'checkin' },
];
