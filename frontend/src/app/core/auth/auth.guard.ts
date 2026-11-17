// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protects the staff pages (/staff/checkin and /staff/attendees).
 * TODO(role-5): wait for the session to be restored before deciding.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/staff/login']);
};
