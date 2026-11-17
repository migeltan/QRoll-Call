// Public (attendee) routes. Owner: Role 4.
import { Routes } from '@angular/router';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'registered',
    loadComponent: () => import('./registered.component').then((m) => m.RegisteredComponent),
  },
];
