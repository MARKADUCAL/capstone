import {
  Component,
  HostListener,
  OnInit,
  Inject,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  RouterModule,
  NavigationEnd,
  Event,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { Subscription, filter, map } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RouterModule,
    ClickOutsideDirective,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  standalone: true,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  showDropdown = false;
  sidebarActive = false;

  // User data properties
  firstName = '';
  lastName = '';
  fullName = 'Admin'; // Default value for SSR
  userInitials = 'AD';

  // Page title
  pageTitle = 'Admin Panel';
  private routeSubscription: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize the subscription
    this.routeSubscription = new Subscription();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.setupRouteTitleTracking();
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  setupRouteTitleTracking() {
    this.routeSubscription = this.router.events
      .pipe(
        filter((event: Event) => event instanceof NavigationEnd),
        map(() => this.getPageTitle(this.activatedRoute))
      )
      .subscribe((title) => {
        this.pageTitle = title;
      });
  }

  getPageTitle(route: ActivatedRoute): string {
    // Get the last segment of the URL path to determine current page
    const path = window.location.pathname;
    const segment = path.split('/').pop() || '';

    // Map URL segments to page titles
    switch (segment) {
      case 'dashboard':
        return 'Dashboard';
      case 'employee-management':
        return 'Employee Management';
      case 'user-management':
        return 'Customer Management';
      case 'washing-point':
        return 'Washing Points Management';
      case 'car-wash-booking':
        return 'Car Wash Bookings';
      case 'inventory-management':
        return 'Inventory Management';
      case 'reporting':
        return 'Reports';
      case 'pages':
        return 'Pages';
      case 'feedback-management':
        return 'Customer Feedback';
      case 'profile':
        return 'Profile';
      default:
        return 'Admin Panel';
    }
  }

  loadUserData() {
    // Only attempt to access localStorage in browser environment
    if (!isPlatformBrowser(this.platformId)) return;

    // Get admin data from localStorage
    const adminDataStr = localStorage.getItem('admin_data');

    if (adminDataStr) {
      try {
        const adminData = JSON.parse(adminDataStr);

        // Set user data properties
        this.firstName = adminData.first_name || '';
        this.lastName = adminData.last_name || '';
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
        if (!this.fullName) this.fullName = 'Admin'; // Set default if empty

        // Create initials from first and last name
        this.userInitials = this.createInitials(this.firstName, this.lastName);
      } catch (error) {
        console.error('Error parsing admin data:', error);
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
      return 'AD'; // Default fallback
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  hideDropdown() {
    this.showDropdown = false;
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;

    // Prevent scrolling of the body when sidebar is open on mobile
    if (isPlatformBrowser(this.platformId)) {
      if (this.sidebarActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  }

  closeSidebarOnMobile() {
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 768) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (
      isPlatformBrowser(this.platformId) &&
      window.innerWidth > 768 &&
      this.sidebarActive
    ) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  logout() {
    // Only attempt to access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Clear any local storage items
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
    }

    // Close the dropdown
    this.hideDropdown();

    // Navigate to login page
    this.router.navigate(['/admin']);
  }
}
