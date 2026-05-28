import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return router.createUrlTree(['/admin']);
  }

  const token = localStorage.getItem('admin_token');
  if (token && token.trim()) {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
