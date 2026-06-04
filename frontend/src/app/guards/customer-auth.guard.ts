import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const customerAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return router.createUrlTree(['/customer']);
  }

  const token = localStorage.getItem('auth_token');
  const customerData = localStorage.getItem('customer_data');

  if (token && token.trim() && customerData) {
    return true;
  }

  return router.createUrlTree(['/customer']);
};
