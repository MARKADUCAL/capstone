import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { ServiceService, Service } from '../../../services/service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-dashboard',
  imports: [CommonModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css',
})
export class CustomerDashboardComponent implements OnInit {
  customerName: string = 'Customer';
  customerBookings: any[] = [];
  availableServices: Service[] = [];
  loading: boolean = false;
  servicesLoading: boolean = false;
  error: string = '';
  servicesError: string = '';

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.loadCustomerBookings();
    this.loadAvailableServices();
  }

  loadCustomerBookings(): void {
    this.loading = true;
    this.error = '';

    // For now, using a hardcoded customer ID (2) as seen in the appointment component
    // In a real app, this would come from an auth service
    const customerId = '2';

    this.bookingService.getBookingsByCustomerId(customerId).subscribe({
      next: (bookings) => {
        // Filter out completed bookings, only show pending and approved
        this.customerBookings = bookings.filter((booking) => {
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

  loadAvailableServices(): void {
    this.servicesLoading = true;
    this.servicesError = '';

    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        // Filter only active services
        this.availableServices = services.filter(
          (service) => service.is_active
        );
        this.servicesLoading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.servicesError = 'Failed to load services. Please try again.';
        this.servicesLoading = false;
      },
    });
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
    return timeString;
  }

  formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return '$0.00';
    }
    return `$${price.toFixed(2)}`;
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
