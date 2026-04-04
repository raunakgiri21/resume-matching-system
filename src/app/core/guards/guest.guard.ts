// core/guards/guest.guard.ts

import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth';
import { Router } from '@angular/router';
import { map, take } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    map((user) => {
      // ❌ Already logged in → go to dashboard
      if (user && user.role) {
        return router.createUrlTree(['/dashboard']);
      }

      // ✅ Not logged in → allow login page
      return true;
    }),
  );
};
