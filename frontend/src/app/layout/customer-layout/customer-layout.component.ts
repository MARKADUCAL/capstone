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
} from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, filter, map } from 'rxjs';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css',
  standalone: true,
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  showDropdown = false;
  sidebarActive = false;

  // User data properties
  firstName = '';
  lastName = '';
  fullName = 'Customer';
  userInitials = 'CU';

  // Page title
  pageTitle = 'Customer Dashboard';
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
      case 'profile':
        return 'Profile';
      case 'services':
        return 'Services & Pricing';
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

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  hideDropdown() {
    this.showDropdown = false;
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;

    // Prevent scrolling of the body when sidebar is open on mobile
    if (window.innerWidth < 768) {
      document.body.style.overflow = this.sidebarActive ? 'hidden' : 'auto';
    }
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth > 768) {
      // Close sidebar if it was opened on mobile
      if (this.sidebarActive) {
        this.sidebarActive = false;
        document.body.style.overflow = 'auto';
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    const userInfoEl = document.querySelector('.user-info');
    if (
      userInfoEl &&
      !userInfoEl.contains(event.target as Node) &&
      this.showDropdown
    ) {
      this.showDropdown = false;
    }
  }

  logout() {
    // Clear the local storage or cookies
    localStorage.removeItem('auth_token');
    localStorage.removeItem('customer_data');

    // Close dropdown
    this.showDropdown = false;

    // Redirect to login page
    this.router.navigate(['/customer']);
  }
}
