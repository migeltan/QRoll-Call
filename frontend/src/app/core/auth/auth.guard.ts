// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protects the staff pages (/staff/checkin and /staff/attendees). */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready; // wait for the saved session to be restored
  return auth.isLoggedIn() ? true : router.createUrlTree(['/staff/login']);
};