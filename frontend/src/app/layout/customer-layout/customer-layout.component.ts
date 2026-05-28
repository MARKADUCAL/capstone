import {
  Component,
  HostListener,
  OnInit,
  Inject,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import {
  Router,
  RouterModule,
  NavigationEnd,
  Event,
  ActivatedRoute,
  RouterOutlet,
} from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, filter, map } from 'rxjs';
import { routerTransition } from '../../animations/page-animations';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterModule, CommonModule, NotificationBellComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css',
  standalone: true,
  animations: [routerTransition],
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  sidebarActive = false;
  sidebarOpen = true;
  showLogoutDialog = false;

  // User data properties
  firstName = '';
  lastName = '';
  fullName = 'Customer';
  userInitials = 'CU';

  // Page title
  pageTitle = 'Customer Dashboard';
  private routeSubscription: Subscription | null = null;
  private navigationSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.setupRouteTitleTracking();
      this.setupNavigationListener();
      this.notificationService.startPolling();
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  setupRouteTitleTracking() {
    this.routeSubscription = this.router.events
      .pipe(
        filter((event: Event) => event instanceof NavigationEnd),
        map(() => this.getPageTitle(this.activatedRoute)),
      )
      .subscribe((title) => {
        this.pageTitle = title;
      });
  }

  setupNavigationListener() {
    // Close mobile sidebar on navigation to maintain consistency
    this.navigationSubscription = this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platformId) && window.innerWidth <= 768) {
          this.sidebarActive = false;
          document.body.style.overflow = 'auto';
        }
      });
  }

  getPageTitle(route: ActivatedRoute): string {
    // Get the last segment of the URL path to determine current page
    const path = window.location.pathname;
    const segment = path.split('/').pop() || '';

    // Map URL segments to page titles
    switch (segment) {
      case 'profile':
        return 'Profile';
      case 'services':
        return 'Customer Dashboard';
      case 'appointment':
        return 'Appointment';
      case 'tranaction-hitory':
        return 'Transaction History';
      default:
        return 'Customer Dashboard';
    }
  }

  loadUserData() {
    // Only attempt to access localStorage in browser environment
    if (!isPlatformBrowser(this.platformId)) return;

    // Get customer data from localStorage
    const customerDataStr = localStorage.getItem('customer_data');

    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);

        // Set user data properties
        this.firstName = customerData.first_name || '';
        this.lastName = customerData.last_name || '';
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
        if (!this.fullName) this.fullName = 'Customer';

        // Create initials from first and last name
        this.userInitials = this.createInitials(this.firstName, this.lastName);
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    }
  }

  // Helper function to create initials from name
  createInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';

    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial + firstInitial;
    } else if (lastInitial) {
      return lastInitial + lastInitial;
    } else {
      return 'CU'; // Default fallback
    }
  }

  toggleSidebar() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.innerWidth <= 768) {
      this.sidebarActive = !this.sidebarActive;
      document.body.style.overflow = this.sidebarActive ? 'hidden' : 'auto';
      return;
    }

    this.sidebarOpen = !this.sidebarOpen;
    document.body.style.overflow = 'auto';
  }

  closeSidebarOnMobile() {
    if (isPlatformBrowser(this.platformId) && window.innerWidth <= 768) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.innerWidth >= 768 && this.sidebarActive) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  logout() {
    this.showLogoutDialog = true;
  }

  confirmLogout() {
    // Only attempt to access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Clear ALL tokens and user data to prevent cross-role contamination
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('employee_token');
      localStorage.removeItem('customer_data');
      localStorage.removeItem('admin_data');
      localStorage.removeItem('employee_data');
      localStorage.removeItem('user_role');
      this.notificationService.stopPolling();

      // Reset body overflow to ensure scrolling works after logout
      document.body.style.overflow = 'auto';
    }

    // Close dialog
    this.showLogoutDialog = false;

    // Redirect to login page
    this.router.navigate(['/customer']);
  }

  cancelLogout() {
    this.showLogoutDialog = false;
  }

  // Animation helper for router outlet
  prepareRoute(outlet: RouterOutlet) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData['animation']
    );
  }
}
