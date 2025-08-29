import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BookingService } from '../../../services/booking.service';
import { ServiceService, Service } from '../../../services/service.service';

@Component({
  selector: 'app-customer-dashboard',
  imports: [CommonModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css',
  standalone: true,
})
export class CustomerDashboardComponent implements OnInit {
  customerName: string = 'Customer';
  customerId: string = '';
  customerBookings: any[] = [];
  availableServices: Service[] = [];
  loading: boolean = false;
  servicesLoading: boolean = false;
  error: string = '';
  servicesError: string = '';
  isBrowser: boolean;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private serviceService: ServiceService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCustomerData();
      this.loadCustomerBookings();
      this.loadAvailableServices();
    }
  }

  // Load customer data from localStorage
  loadCustomerData(): void {
    if (!this.isBrowser) return;

    const customerDataStr = localStorage.getItem('customer_data');
    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);

        // Set customer data properties
        this.customerName = `${customerData.first_name || ''} ${
          customerData.last_name || ''
        }`.trim();
        if (!this.customerName) this.customerName = 'Customer';

        // Get customer ID from the data
        this.customerId = customerData.id || customerData.customer_id || '';

        if (!this.customerId) {
          console.error('No customer ID found in customer data');
          this.error = 'Customer authentication failed. Please log in again.';
        }
      } catch (error) {
        console.error('Error parsing customer data:', error);
        this.error =
          'Failed to load customer information. Please log in again.';
      }
    } else {
      console.error('No customer data found in localStorage');
      this.error = 'Please log in to view your dashboard.';
    }
  }

  loadCustomerBookings(): void {
    if (!this.customerId) {
      this.error = 'Customer authentication required. Please log in again.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.bookingService.getBookingsByCustomerId(this.customerId).subscribe({
      next: (bookings) => {
        // Security check: Ensure all bookings belong to the authenticated customer
        const validatedBookings = this.validateCustomerBookings(bookings);

        // Filter out completed bookings, only show pending and approved
        this.customerBookings = validatedBookings.filter((booking) => {
          const status = booking.status?.toLowerCase();
          return (
            status === 'pending' ||
            status === 'approved' ||
            status === 'confirmed'
          );
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.error = 'Failed to load bookings. Please try again.';
        this.loading = false;
      },
    });
  }

  // Security validation: Ensure all bookings belong to the authenticated customer
  private validateCustomerBookings(bookings: any[]): any[] {
    if (!this.customerId) return [];

    return bookings.filter((booking) => {
      // Check if the booking has a customer_id that matches the authenticated customer
      const bookingCustomerId = booking.customer_id || booking.customerId;

      if (
        bookingCustomerId &&
        bookingCustomerId.toString() !== this.customerId.toString()
      ) {
        console.warn(
          'Security warning: Attempted to access booking for different customer',
          {
            authenticatedCustomerId: this.customerId,
            bookingCustomerId: bookingCustomerId,
            bookingId: booking.id,
          }
        );
        return false; // Filter out bookings that don't belong to this customer
      }

      return true; // Keep bookings that belong to this customer
    });
  }

  loadAvailableServices(): void {
    this.servicesLoading = true;
    this.servicesError = '';

    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        // Filter only active services and ensure proper data types
        this.availableServices = services
          .filter((service) => service.is_active)
          .map((service) => ({
            ...service,
            price: this.parsePrice(service.price),
            duration_minutes:
              parseInt(service.duration_minutes.toString()) || 0,
          }));

        this.servicesLoading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.servicesError = 'Failed to load services. Please try again.';
        this.servicesLoading = false;
      },
    });
  }

  // Helper method to parse price data and ensure it's a number
  private parsePrice(price: any): number {
    if (price === null || price === undefined || price === '') {
      return 0;
    }

    // Convert to number
    const numPrice =
      typeof price === 'string' ? parseFloat(price) : Number(price);

    // Check if it's a valid number
    if (isNaN(numPrice)) {
      console.warn('Invalid price value:', price, 'type:', typeof price);
      return 0;
    }

    return numPrice;
  }

  navigateToAppointment(): void {
    this.router.navigate(['/customer-view/appointment']);
  }

  navigateToAppointmentWithService(serviceName: string): void {
    // Navigate to appointment page with service pre-selected
    this.router.navigate(['/customer-view/appointment'], {
      queryParams: { service: serviceName },
    });
  }

  // Handle authentication errors by redirecting to login
  redirectToLogin(): void {
    // Clear any invalid data
    localStorage.removeItem('customer_data');
    localStorage.removeItem('auth_token');

    // Redirect to customer login
    this.router.navigate(['/customer']);
  }

  // Logout method for customers
  logout(): void {
    // Clear all customer data
    localStorage.removeItem('customer_data');
    localStorage.removeItem('auth_token');

    // Redirect to customer login
    this.router.navigate(['/customer']);
  }

  // Check if customer is properly authenticated
  isAuthenticated(): boolean {
    return !!(
      this.customerId &&
      this.customerName &&
      this.customerName !== 'Customer'
    );
  }

  // Debug method to show current authentication status
  debugAuthStatus(): void {
    console.log('Current Authentication Status:', {
      customerId: this.customerId,
      customerName: this.customerName,
      isAuthenticated: this.isAuthenticated(),
      localStorageData: localStorage.getItem('customer_data'),
    });
  }

  // Refresh customer data and reload everything
  refreshCustomerData(): void {
    this.loadCustomerData();
    if (this.isAuthenticated()) {
      this.loadCustomerBookings();
    }
  }

  // Check if the current session is still valid
  isSessionValid(): boolean {
    if (!this.isBrowser) return false;

    const customerData = localStorage.getItem('customer_data');
    const authToken = localStorage.getItem('auth_token');

    return !!(customerData && authToken);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
      case 'rejected':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';

    // Parse the time string (assuming format like "11:11:00")
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    // Convert to 12-hour format
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    // Format with leading zero for minutes if needed
    const displayMinute = minute.toString().padStart(2, '0');

    return `${displayHour}:${displayMinute}${period}`;
  }

  formatPrice(price: number): string {
    if (price === null || price === undefined) {
      return 'Price not set';
    }

    if (typeof price !== 'number' || isNaN(price)) {
      return 'Price not set';
    }

    if (price <= 0) {
      return 'Price not set';
    }

    return `₱${price.toFixed(2)}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `Duration: ${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `Duration: ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `Duration: ${hours}h ${remainingMinutes}m`;
      }
    }
  }
}
