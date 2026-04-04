// core/guards/access.guard.ts

import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth';
import { Router } from '@angular/router';
import { map, take } from 'rxjs';

export const accessGuard = (role?: 'admin' | 'student'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.user$.pipe(
      take(1),
      map((user) => {
        // ❌ Not logged in
        if (!user || !user.role) {
          return router.createUrlTree(['/login']);
        }

        // ❌ Role mismatch
        if (role && user.role !== role) {
          return router.createUrlTree(['/dashboard']);
        }

        // ✅ Allowed
        return true;
      }),
    );
  };
};
