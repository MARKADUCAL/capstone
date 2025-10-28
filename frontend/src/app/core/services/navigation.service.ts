import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private previousUrl: string = '';
  private currentUrl: string = '';
  private queryParams: any = {};

  constructor(private router: Router, private route: ActivatedRoute) {
    // Track navigation history
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      });

    // Track query parameters
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  /**
   * Get the previous URL
   */
  getPreviousUrl(): string {
    return this.previousUrl;
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.currentUrl;
  }

  /**
   * Get current query parameters
   */
  getQueryParams(): any {
    return this.queryParams;
  }

  /**
   * Check if the previous URL was a register page
   */
  isFromRegisterPage(): boolean {
    return this.previousUrl.includes('-register') || this.queryParams['from']?.includes('-register');
  }

  /**
   * Get the register page type from the previous URL or query params
   */
  getRegisterPageType(): 'customer' | 'admin' | 'employee' | null {
    // First check query params (more reliable)
    if (this.queryParams['from']) {
      const fromParam = this.queryParams['from'];
      if (fromParam.includes('customer-register')) {
        return 'customer';
      } else if (fromParam.includes('admin-register')) {
        return 'admin';
      } else if (fromParam.includes('employee-register')) {
        return 'employee';
      }
    }

    // Fallback to checking previous URL
    if (this.previousUrl.includes('customer-register')) {
      return 'customer';
    } else if (this.previousUrl.includes('admin-register')) {
      return 'admin';
    } else if (this.previousUrl.includes('employee-register')) {
      return 'employee';
    }

    return null;
  }

  /**
   * Get the register route based on the page type
   */
  getRegisterRoute(): string {
    const pageType = this.getRegisterPageType();
    
    switch (pageType) {
      case 'customer':
        return '/customer-register';
      case 'admin':
        return '/admin-register';
      case 'employee':
        return '/employee-register';
      default:
        return '/';
    }
  }

  /**
   * Navigate back to the appropriate register page or home
   */
  navigateBackToRegister(): void {
    const route = this.getRegisterRoute();
    this.router.navigate([route]);
  }

  /**
   * Set a specific referrer URL (useful for testing or manual setting)
   */
  setReferrer(url: string): void {
    this.previousUrl = url;
  }
}
