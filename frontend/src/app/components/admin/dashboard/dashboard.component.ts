import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BookingDetailsDialog } from './booking-details-dialog.component';

interface BusinessStats {
  totalCustomers: number;
  totalBookings: number;
  totalEmployees: number;
  totalRevenue: number;
  completedBookings: number;
  pendingBookings: number;
}

interface RecentBooking {
  id: number;
  customerName: string;
  service: string;
  status: string;
  amount: number;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  businessStats: BusinessStats = {
    totalCustomers: 0,
    totalBookings: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0,
  };

  recentBookings: RecentBooking[] = [];

  displayedColumns: string[] = [
    'customerName',
    'service',
    'amount',
    'status',
    'date',
    'actions',
  ];

  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;

  // Loading states
  isLoading = true;
  isLoadingStats = true;
  isLoadingBookings = true;

  // Auto-refresh interval (5 minutes)
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();

    // Set up auto-refresh
    interval(this.REFRESH_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.isLoadingStats = true;
    this.isLoadingBookings = true;

    // Load dashboard summary first for better performance
    Promise.all([
      this.loadDashboardSummary(),
      this.loadRecentBookings(),
    ]).finally(() => {
      this.isLoading = false;
      this.isLoadingStats = false;
      this.isLoadingBookings = false;
    });
  }

  private loadDashboardSummary(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_dashboard_summary`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            const data = response.payload?.dashboard_summary || {};
            this.businessStats = {
              totalCustomers: Number(data.total_customers) || 0,
              totalBookings: Number(data.total_bookings) || 0,
              totalEmployees: Number(data.total_employees) || 0,
              // Keep a sensible default for satisfaction as backend doesn't provide it
              totalRevenue: Number(data.monthly_revenue) || 0,
              completedBookings: Number(data.completed_bookings) || 0,
              pendingBookings: Number(data.pending_bookings) || 0,
            };
          }
        },
        error: (error) => {
          console.error('Error fetching dashboard summary:', error);
          this.showError('Failed to load dashboard summary');
          // Fallback to individual API calls
          this.loadIndividualStats();
        },
        complete: () => resolve(),
      });
    });
  }

  private loadIndividualStats(): void {
    // Fallback method if dashboard summary fails
    Promise.all([
      this.loadCustomerCount(),
      this.loadEmployeeCount(),
      this.loadBookingCount(),
      this.loadCompletedBookingCount(),
      this.loadPendingBookingCount(),
    ]);
  }

  private loadCustomerCount(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_customer_count`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.businessStats.totalCustomers =
              response.payload.total_customers;
          }
        },
        error: (error) => {
          console.error('Error fetching customer count:', error);
          this.showError('Failed to load customer count');
        },
        complete: () => resolve(),
      });
    });
  }

  private loadEmployeeCount(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_employee_count`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.businessStats.totalEmployees =
              response.payload.total_employees;
          }
        },
        error: (error) => {
          console.error('Error fetching employee count:', error);
          this.showError('Failed to load employee count');
        },
        complete: () => resolve(),
      });
    });
  }

  private loadBookingCount(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_booking_count`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.businessStats.totalBookings = response.payload.total_bookings;
          }
        },
        error: (error) => {
          console.error('Error fetching booking count:', error);
          this.showError('Failed to load booking count');
        },
        complete: () => resolve(),
      });
    });
  }

  private loadCompletedBookingCount(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_completed_booking_count`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.businessStats.completedBookings =
              response.payload.completed_bookings;
          }
        },
        error: (error) => {
          console.error('Error fetching completed booking count:', error);
        },
        complete: () => resolve(),
      });
    });
  }

  private loadPendingBookingCount(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_pending_booking_count`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.businessStats.pendingBookings =
              response.payload.pending_bookings;
          }
        },
        error: (error) => {
          console.error('Error fetching pending booking count:', error);
        },
        complete: () => resolve(),
      });
    });
  }

  private loadRecentBookings(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_all_bookings`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            const bookings = response.payload.bookings || [];
            console.log('API Response - Bookings:', bookings); // Debug log

            this.recentBookings = bookings.slice(0, 10).map((booking: any) => {
              console.log('Processing booking:', booking); // Debug log for each booking

              // Get customer name from firstname and lastname
              let customerName = 'Unknown Customer';

              // Debug: Log firstname and lastname fields
              console.log('Customer name fields:', {
                firstname: booking.firstname,
                lastname: booking.lastname,
                first_name: booking.first_name,
                last_name: booking.last_name,
              });

              // Combine firstname and lastname
              const firstName = booking.firstname || booking.first_name || '';
              const lastName = booking.lastname || booking.last_name || '';
              customerName = `${firstName} ${lastName}`.trim();

              // If no name found, try fallback fields
              if (!customerName || customerName === '') {
                if (
                  booking.customer_name ||
                  booking.customerName ||
                  booking.name
                ) {
                  customerName =
                    booking.customer_name ||
                    booking.customerName ||
                    booking.name;
                } else if (booking.customer?.name || booking.user?.name) {
                  customerName = booking.customer?.name || booking.user?.name;
                } else {
                  customerName = 'Unknown Customer';
                }
              }

              console.log('Final customer name:', customerName);

              return {
                id: booking.id,
                customerName: customerName,
                service:
                  booking.service_name ||
                  booking.serviceName ||
                  booking.service ||
                  'Unknown Service',
                status: booking.status || 'Pending',
                amount: booking.price || booking.amount || 0,
                date:
                  booking.wash_date ||
                  booking.washDate ||
                  booking.date ||
                  booking.booking_date ||
                  'Unknown Date',
              };
            });

            // Calculate total revenue
            this.businessStats.totalRevenue = bookings.reduce(
              (total: number, booking: any) => {
                return total + (booking.price || booking.amount || 0);
              },
              0
            );
          }
        },
        error: (error) => {
          console.error('Error fetching recent bookings:', error);
          this.showError('Failed to load recent bookings');
        },
        complete: () => resolve(),
      });
    });
  }

  updateBookingStatus(bookingId: number, newStatus: string): void {
    const booking = this.recentBookings.find((b) => b.id === bookingId);
    if (booking) {
      // Update local state immediately for better UX
      const originalStatus = booking.status;
      booking.status = newStatus;

      // Call API to update backend
      this.http
        .put(`${this.apiUrl}/update_booking_status`, {
          id: bookingId,
          status: newStatus,
        })
        .subscribe({
          next: (response: any) => {
            if (response?.status?.remarks === 'success') {
              this.showSuccess(`Booking status updated to ${newStatus}`);
              // Refresh data to ensure consistency
              this.loadRecentBookings();
            } else {
              // Revert on failure
              booking.status = originalStatus;
              this.showError('Failed to update booking status');
            }
          },
          error: (error) => {
            console.error('Error updating booking status:', error);
            // Revert on error
            booking.status = originalStatus;
            this.showError('Failed to update booking status');
          },
        });
    }
  }

  viewBookingDetails(bookingId: number): void {
    const booking = this.recentBookings.find((b) => b.id === bookingId);
    if (booking) {
      // Create a simple dialog to show booking details
      const dialogRef = this.dialog.open(BookingDetailsDialog, {
        width: '500px',
        data: booking,
      });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar'],
    });
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return (
      '₱' +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    if (!dateString || dateString === 'Unknown Date') {
      return 'Unknown Date';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Helper method to get status icon
  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'in progress':
        return 'play_arrow';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  }
}
