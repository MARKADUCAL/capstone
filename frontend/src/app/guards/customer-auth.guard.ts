import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.servide';

export const customerAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return router.createUrlTree(['/customer']);
  }

  // Use AuthService instead of direct localStorage access
  // This ensures consistency and prevents race conditions
  if (authService.isAuthenticated() && authService.isCustomer()) {
    return true;
  }

  return router.createUrlTree(['/customer']);
};
