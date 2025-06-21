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
  selector: 'app-employee-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RouterModule,
    ClickOutsideDirective,
  ],
  templateUrl: './employee-layout.component.html',
  styleUrl: './employee-layout.component.css',
  standalone: true,
})
export class EmployeeLayoutComponent implements OnInit, OnDestroy {
  showDropdown = false;
  sidebarActive = false;

  // User data properties
  firstName = '';
  lastName = '';
  fullName = 'Employee';
  userInitials = 'EM';

  // Page title
  pageTitle = 'Employee Dashboard';
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
      case 'appointments':
        return 'Appointments';
      case 'customer-records':
        return 'Customer Records';
      case 'inventory':
        return 'Inventory';
      case 'profile':
        return 'Profile';
      default:
        return 'Employee Dashboard';
    }
  }

  loadUserData() {
    // Only attempt to access localStorage in browser environment
    if (!isPlatformBrowser(this.platformId)) return;

    // Get employee data from localStorage
    const employeeDataStr = localStorage.getItem('employee_data');

    if (employeeDataStr) {
      try {
        const employeeData = JSON.parse(employeeDataStr);

        // Set user data properties
        this.firstName = employeeData.first_name || '';
        this.lastName = employeeData.last_name || '';
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
        if (!this.fullName) this.fullName = 'Employee';

        // Create initials from first and last name
        this.userInitials = this.createInitials(this.firstName, this.lastName);
      } catch (error) {
        console.error('Error parsing employee data:', error);
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
      return 'EM'; // Default fallback
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
    if (this.sidebarActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
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
      localStorage.removeItem('employee_token');
      localStorage.removeItem('employee_data');
    }

    // Close the dropdown
    this.hideDropdown();

    // Navigate to login page
    this.router.navigate(['/employee']);
  }
}
