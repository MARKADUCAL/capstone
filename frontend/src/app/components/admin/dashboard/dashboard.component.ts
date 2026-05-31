import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BookingDetailsDialog } from './booking-details-dialog.component';
import { DateBookingsDialogComponent } from './date-bookings-dialog.component';
import Swal from 'sweetalert2';
import { Subscription, forkJoin, concat, of, timer } from 'rxjs';
import { catchError, takeUntil, shareReplay } from 'rxjs/operators';
import { ApiCacheService } from '../../../services/api-cache.service';
import { DestroyRef, inject } from '@angular/core';

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
  // Additional date fields that may exist in the booking data
  wash_date?: string;
  washDate?: string;
  booking_date?: string;
  // Status-specific fields
  assignedEmployeeName?: string;
  assigned_employee_name?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  cancellationReason?: string;
  cancellation_reason?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  customerRating?: number;
  customerRatingComment?: string;
  customer_rating?: number;
  customer_rating_comment?: string;
  feedback_comment?: string;
  assignedBy?: string;
  assigned_by?: string;
  admin_name?: string;
}

type CalendarEventType =
  | 'pending'
  | 'ongoing'
  | 'cancelled'
  | 'declined'
  | 'done'
  | 'complete'
  | 'expired'
  | 'default';

interface CalendarEvent {
  label: string;
  type: CalendarEventType;
}

interface CalendarDay {
  date: number;
  year: number;
  month: number;
  isOtherMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
  bookingsPageSize = 7;
  bookingsCurrentPage = 1;
  bookingsSearchTerm = '';

  private bookingSearchHaystack(booking: RecentBooking): string {
    const parts = [
      booking.id,
      booking.customerName,
      booking.service,
      booking.status,
      this.displayStatus(booking.status),
      booking.amount,
      booking.date,
      this.formatDate(booking.date),
      booking.assignedEmployeeName,
      booking.assigned_employee_name,
      booking.employee_first_name,
      booking.employee_last_name,
      booking.assignedBy,
      booking.assigned_by,
      booking.admin_name,
    ];

    return parts
      .filter((p) => p !== undefined && p !== null)
      .map((p) => String(p).trim())
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  get filteredBookings(): RecentBooking[] {
    const term = (this.bookingsSearchTerm || '').trim().toLowerCase();
    if (!term) return this.recentBookings;
    return this.recentBookings.filter((b) =>
      this.bookingSearchHaystack(b).includes(term),
    );
  }

  get paginatedBookings(): RecentBooking[] {
    const start = (this.bookingsCurrentPage - 1) * this.bookingsPageSize;
    return this.filteredBookings.slice(start, start + this.bookingsPageSize);
  }

  get totalBookingsPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredBookings.length / this.bookingsPageSize),
    );
  }

  get bookingsPageRange(): { start: number; end: number; total: number } {
    const total = this.filteredBookings.length;
    if (total === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    const start = (this.bookingsCurrentPage - 1) * this.bookingsPageSize + 1;
    const end = Math.min(
      this.bookingsCurrentPage * this.bookingsPageSize,
      total,
    );
    return { start, end, total };
  }

  goToBookingsPage(page: number): void {
    if (page >= 1 && page <= this.totalBookingsPages) {
      this.bookingsCurrentPage = page;
    }
  }

  onBookingsSearchTermChange(value: string): void {
    this.bookingsSearchTerm = value;
    this.bookingsCurrentPage = 1;
  }

  clearBookingsSearch(): void {
    this.bookingsSearchTerm = '';
    this.bookingsCurrentPage = 1;
  }

  displayedColumns: string[] = [
    'customerName',
    'service',
    'amount',
    'status',
    'date',
    'actions',
  ];

  private apiUrl = environment.apiUrl;

  // Loading states
  isLoading = true;
  isLoadingStats = true;
  isLoadingBookings = true;

  // Calendar properties
  currentDate = new Date();
  today = new Date();
  weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
  calendarDays: CalendarDay[] = [];

  private destroyRef = inject(DestroyRef);
  private apiCache = inject(ApiCacheService);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  private autoRefreshSub: Subscription | null = null;
  private countdownSub: Subscription | null = null;
  private employeeCountLoaded = false;
  refreshCountdown = 0;

  private dataLoadedOnce = false;

  ngOnInit(): void {
    // Debounce: only load once per component lifecycle to prevent
    // duplicate calls from navigation/route re-evaluation.
    if (this.dataLoadedOnce) return;
    this.dataLoadedOnce = true;

    this.loadDashboardData();
    this.generateCalendar();
    this.checkFirstTimeLogin();
  }

  ngOnDestroy(): void {
    this.autoRefreshSub?.unsubscribe();
    this.autoRefreshSub = null;
    this.countdownSub?.unsubscribe();
    this.countdownSub = null;
  }

  private checkFirstTimeLogin(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const adminData = localStorage.getItem('admin_data');
    const parsedAdmin = adminData ? JSON.parse(adminData) : null;
    const adminId = parsedAdmin?.id ?? 'unknown';
    const adminName = parsedAdmin?.first_name ?? 'Admin';
    const flagKey = `admin_first_time_login_${adminId}`;

    const firstTimeLoginFlag = localStorage.getItem(flagKey);

    if (!firstTimeLoginFlag) {
      Swal.fire({
        title: `Welcome ${adminName}! 👋`,
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="margin-bottom: 15px;">You're logged in to the Admin Dashboard for the first time. Here's what we recommend to get you started:</p>

            <div style="background-color: #f0f7ff; border-left: 4px solid #42a5f5; padding: 15px; margin-top: 15px; border-radius: 4px;">
              <p style="font-weight: 600; color: #1565c0; margin-bottom: 8px;">🔑 Set Up Your Account</p>
              <p style="margin: 0; font-size: 14px; color: #555;">We recommend updating your password to something personal and memorable. You can do this anytime by going to <strong>Profile &gt; Change Password</strong>.</p>
            </div>

            <div style="background-color: #f0f7ff; border-left: 4px solid #2196F3; padding: 15px; margin-top: 15px; border-radius: 4px;">
              <p style="font-weight: 600; color: #1976d2; margin-bottom: 10px;">🚀 Getting Started Checklist:</p>
              <ul style="margin: 0; padding-left: 20px; text-align: left; font-size: 14px;">
                <li style="margin-bottom: 8px;"><strong>Set Your Password</strong> - Go to Profile &gt; Change Password</li>
                <li style="margin-bottom: 8px;"><strong>Update Your Profile</strong> - Update your contact information</li>
                <li style="margin-bottom: 8px;"><strong>Review Dashboard Metrics</strong> - Understand your business statistics</li>
                <li style="margin-bottom: 8px;"><strong>Manage Employees</strong> - Add and organize your team</li>
                <li style="margin-bottom: 8px;"><strong>Configure Services</strong> - Set up service packages and pricing</li>
                <li style="margin-bottom: 8px;"><strong>Edit Landing Page</strong> - Customize your public-facing website</li>
                <li style="margin-bottom: 8px;"><strong>Review Bookings</strong> - Monitor and manage customer bookings</li>
                <li style="margin-bottom: 0;"><strong>View Reports</strong> - Track revenue and analytics</li>
              </ul>
            </div>

            <div style="background-color: #f0fff0; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px; border-radius: 4px;">
              <p style="font-weight: 600; color: #2e7d32; margin-bottom: 8px;">💡 Pro Tips:</p>
              <ul style="margin: 0; padding-left: 20px; text-align: left; font-size: 13px;">
                <li>Check the admin profile regularly for important updates</li>
                <li>Keep your employee information current for better management</li>
                <li>Monitor customer feedback and ratings to improve service</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#2196F3',
        confirmButtonText: 'Got it, Show me the Dashboard',
        width: 560,
        didClose: () => {
          localStorage.setItem(flagKey, 'true');
        },
      }).then(() => {
        localStorage.setItem(flagKey, 'true');
      });
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.isLoadingStats = true;
    this.isLoadingBookings = true;

    // Consolidate all 3 API calls into a single forkJoin to avoid
    // triggering server rate limits from simultaneous requests.
    const dashboardSummary$ = this.apiCache.get<any>(
      `${this.apiUrl}/get_dashboard_summary`,
    ).pipe(
      catchError((error) => {
        if (error.status !== 429) {
          console.error('Error fetching dashboard summary:', error);
          this.showError('Failed to load dashboard summary');
        }
        return of({ status: { remarks: 'error' } });
      }),
    );

    const bookings$ = this.apiCache.get<any>(
      `${this.apiUrl}/get_all_bookings`,
    ).pipe(
      catchError((error) => {
        if (error.status !== 429) {
          console.error('Error fetching recent bookings:', error);
          this.showError('Failed to load recent bookings');
        }
        return of({ status: { remarks: 'error' }, payload: { bookings: [] } });
      }),
    );

    const employees$ = this.apiCache.get<any>(
      `${this.apiUrl}/get_all_employees`,
    ).pipe(
      catchError((error) => {
        if (error.status !== 429) {
          console.error('Error fetching employees:', error);
          this.showError('Failed to load employee count');
        }
        return of({ status: { remarks: 'error' }, payload: { employees: [] } });
      }),
    );

    forkJoin({
      summary: dashboardSummary$,
      bookings: bookings$,
      employees: employees$,
    }).subscribe({
      next: (results) => {
        // Process dashboard summary
        const data = results.summary?.payload?.dashboard_summary || {};
        if (results.summary?.status?.remarks === 'success') {
          this.businessStats = {
            totalCustomers: Number(data.total_customers) || 0,
            totalBookings: Number(data.total_bookings) || 0,
            totalEmployees: Number(data.total_employees) || 0,
            totalRevenue: Number(data.monthly_revenue) || 0,
            completedBookings: Number(data.completed_bookings) || 0,
            pendingBookings: Number(data.pending_bookings) || 0,
          };
        }

        // Process employees
        if (results.employees?.status?.remarks === 'success') {
          const employees = results.employees.payload?.employees || [];
          if (Array.isArray(employees)) {
            const hasApprovalFlag = employees.some(
              (e: any) => 'is_approved' in e && e.is_approved !== undefined,
            );
            if (hasApprovalFlag) {
              const approvedEmployees = employees.filter(
                (emp: any) => emp.is_approved === 1,
              );
              this.businessStats.totalEmployees = approvedEmployees.length;
            } else {
              this.businessStats.totalEmployees = employees.length;
            }
          }
        }

        // Process bookings
        this.processBookingsResponse(results.bookings?.payload?.bookings || []);

        this.isLoading = false;
        this.isLoadingStats = false;
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Dashboard data load error:', error);
        this.showError('Failed to load dashboard data');
        this.isLoading = false;
        this.isLoadingStats = false;
        this.isLoadingBookings = false;
      },
    });
  }

  private processBookingsResponse(bookings: any[]): void {
    this.recentBookings = bookings.map((booking: any) => {
      let customerName = 'Unknown Customer';
      const firstName = booking.firstname || booking.first_name || '';
      const lastName = booking.lastname || booking.last_name || '';
      customerName = `${firstName} ${lastName}`.trim();

      if (!customerName) {
        customerName =
          booking.customer_name ||
          booking.customerName ||
          booking.name ||
          booking.customer?.name ||
          booking.user?.name ||
          'Unknown Customer';
      }

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
        assignedEmployeeName:
          booking.assignedEmployeeName ||
          booking.assigned_employee_name ||
          (booking.employee_first_name && booking.employee_last_name
            ? `${booking.employee_first_name} ${booking.employee_last_name}`
            : undefined),
        employee_first_name: booking.employee_first_name,
        employee_last_name: booking.employee_last_name,
        cancellationReason:
          booking.cancellationReason || booking.cancellation_reason,
        rejectionReason:
          booking.rejectionReason || booking.rejection_reason,
        customerRating:
          booking.customerRating || booking.customer_rating || booking.rating,
        customerRatingComment:
          booking.customerRatingComment ||
          booking.customer_rating_comment ||
          booking.feedback_comment ||
          booking.comment,
        assignedBy:
          booking.assignedBy || booking.assigned_by || booking.admin_name,
      };
    });

    this.bookingsCurrentPage = 1;

    this.businessStats.totalRevenue = bookings.reduce(
      (total: number, booking: any) => {
        return total + (booking.price || booking.amount || 0);
      },
      0,
    );

    this.markExpiredBookings();
    this.generateCalendar();
  }

  // Check if a booking date has passed (is in the past)
  private isBookingDatePassed(dateString: string): boolean {
    if (!dateString || dateString === 'Unknown Date') return false;
    const trimmed = String(dateString).trim();
    if (
      trimmed === '0000-00-00' ||
      trimmed === '0000-00-00 00:00:00' ||
      trimmed.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    const bookingDate = new Date(trimmed);
    if (isNaN(bookingDate.getTime())) return false;

    // Set booking date to end of day for comparison
    bookingDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookingDate < today;
  }

  // Mark pending bookings as expired if their date has passed
  private markExpiredBookings(): void {
    const expiredBookingIds: number[] = [];

    this.recentBookings.forEach((booking) => {
      const normalizedStatus = this.normalizeStatus(booking.status);
      if (
        normalizedStatus === 'pending' &&
        this.isBookingDatePassed(booking.date)
      ) {
        // Mark locally as expired
        booking.status = 'Expired';
        expiredBookingIds.push(booking.id);
      }
    });

    // BEFORE: forEach loop fired all API calls simultaneously (7 requests at once)
    // AFTER: Use RxJS concat to fire calls sequentially, one after another
    if (expiredBookingIds.length > 0) {
      // Create an array of observables for each status update
      const updateObservables = expiredBookingIds.map((bookingId) =>
        this.http
          .put(`${this.apiUrl}/update_booking_status`, {
            id: bookingId,
            status: 'Expired',
          })
          .pipe(
            catchError((err) => {
              console.error(
                `Failed to mark booking #${bookingId} as Expired:`,
                err,
              );
              return of(null); // Continue with next request even if this one fails
            }),
          ),
      );

      // Execute all updates sequentially using concat
      concat(...updateObservables).subscribe({
        complete: () => {
          // Regenerate calendar after all updates are complete
          this.generateCalendar();
        },
      });
    }
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
              // Refresh data with cache bust to ensure consistency
              this.refreshDashboardData();
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

  /**
   * Refresh data with cache bust (used after mutations like status updates).
   */
  refreshDashboardData(): void {
    this.apiCache.clearCache(`${this.apiUrl}/get_all_bookings`);
    this.apiCache.clearCache(`${this.apiUrl}/get_dashboard_summary`);
    this.loadDashboardData();
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

  // Display-friendly status mapping
  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    if (s.toLowerCase() === 'approved') return 'Ongoing';
    if (s.toLowerCase() === 'expired') return 'Expired';
    return s;
  }

  private normalizeStatus(status: string): string {
    return (status || '').toString().trim().toLowerCase();
  }

  private getCalendarStatusType(status: string): CalendarEventType {
    const normalized = this.normalizeStatus(status);
    switch (normalized) {
      case 'pending':
        return 'pending';
      case 'approved':
      case 'in progress':
      case 'ongoing':
        return 'ongoing';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'rejected':
      case 'declined':
        return 'declined';
      case 'done':
        return 'done';
      case 'completed':
      case 'complete':
        return 'complete';
      case 'expired':
        return 'expired';
      default:
        return 'default';
    }
  }

  private getCalendarStatusLabel(status: string): string {
    const type = this.getCalendarStatusType(status);
    switch (type) {
      case 'pending':
        return 'Pending';
      case 'ongoing':
        return 'Ongoing';
      case 'cancelled':
        return 'Cancelled';
      case 'declined':
        return 'Declined';
      case 'done':
        return 'Done';
      case 'complete':
        return 'Complete';
      case 'expired':
        return 'Expired';
      default:
        return this.displayStatus(status) || 'Pending';
    }
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

  // Calendar methods
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = this.today;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday)
    let startDay = firstDay.getDay();

    // Get days from previous month
    const prevMonthDate = new Date(year, month, 0);
    const daysInPrevMonth = prevMonthDate.getDate();

    this.calendarDays = [];

    // Add days from previous month
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthNum = month === 0 ? 11 : month - 1;
    for (let i = startDay - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      const isToday =
        date === today.getDate() &&
        prevMonthNum === today.getMonth() &&
        prevYear === today.getFullYear();
      this.calendarDays.push({
        date: date,
        year: prevYear,
        month: prevMonthNum,
        isOtherMonth: true,
        isToday: isToday,
        events: this.getEventsForDate(prevYear, prevMonthNum, date),
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      this.calendarDays.push({
        date: day,
        year: year,
        month: month,
        isOtherMonth: false,
        isToday: isToday,
        events: this.getEventsForDate(year, month, day),
      });
    }

    // Add days from next month to fill the grid (6 rows = 42 days)
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const isToday =
        day === today.getDate() &&
        nextMonth === today.getMonth() &&
        nextYear === today.getFullYear();
      this.calendarDays.push({
        date: day,
        year: nextYear,
        month: nextMonth,
        isOtherMonth: true,
        isToday: isToday,
        events: this.getEventsForDate(nextYear, nextMonth, day),
      });
    }
  }

  getEventsForDate(year: number, month: number, day: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Map bookings to calendar events
    if (this.recentBookings && this.recentBookings.length > 0) {
      this.recentBookings.forEach((booking) => {
        try {
          const bookingDate = new Date(booking.date);
          if (
            bookingDate.getFullYear() === year &&
            bookingDate.getMonth() === month &&
            bookingDate.getDate() === day
          ) {
            events.push({
              label: this.getCalendarStatusLabel(booking.status),
              type: this.getCalendarStatusType(booking.status),
            });
          }
        } catch (error) {
          console.warn('Error parsing booking date:', booking.date, error);
        }
      });
    }

    // Sample events for demonstration (only for January 2025)
    // Remove this when you have real booking data
    if (year === 2025 && month === 0 && events.length === 0) {
      const sampleEvents: { [key: number]: CalendarEvent[] } = {
        1: [{ label: 'Pending', type: 'pending' }],
        3: [
          { label: 'Ongoing', type: 'ongoing' },
          { label: 'Cancelled', type: 'cancelled' },
        ],
        5: [
          { label: 'Pending', type: 'pending' },
          { label: 'Declined', type: 'declined' },
        ],
        7: [{ label: 'Done', type: 'done' }],
        9: [
          { label: 'Pending', type: 'pending' },
          { label: 'Ongoing', type: 'ongoing' },
        ],
        11: [{ label: 'Cancelled', type: 'cancelled' }],
        14: [{ label: 'Complete', type: 'complete' }],
        19: [
          { label: 'Pending', type: 'pending' },
          { label: 'Declined', type: 'declined' },
          { label: 'Complete', type: 'complete' },
        ],
        24: [{ label: 'Ongoing', type: 'ongoing' }],
        25: [
          { label: 'Pending', type: 'pending' },
          { label: 'Done', type: 'done' },
          { label: 'Complete', type: 'complete' },
        ],
        27: [
          { label: 'Cancelled', type: 'cancelled' },
          { label: 'Declined', type: 'declined' },
          { label: 'Pending', type: 'pending' },
        ],
        31: [{ label: 'Complete', type: 'complete' }],
      };

      return sampleEvents[day] || [];
    }

    return events;
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1,
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1,
    );
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.today = new Date();
    this.generateCalendar();
  }

  isCurrentMonth(): boolean {
    const today = new Date();
    return (
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear()
    );
  }

  openDateBookingsModal(day: CalendarDay): void {
    const selectedDate = new Date(day.year, day.month, day.date);
    const bookingsForDate = this.getBookingsForDate(selectedDate);

    const dialogRef = this.dialog.open(DateBookingsDialogComponent, {
      width: window.innerWidth <= 768 ? '100vw' : '600px',
      maxWidth: window.innerWidth <= 768 ? '100vw' : '700px',
      height: window.innerWidth <= 768 ? '100vh' : 'auto',
      maxHeight: window.innerWidth <= 768 ? '100vh' : '80vh',
      panelClass: window.innerWidth <= 768 ? 'mobile-dialog' : '',
      data: {
        date: selectedDate,
        bookings: bookingsForDate,
        formattedDate: this.formatDateForModal(selectedDate),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.bookingId) {
        this.viewBookingDetails(result.bookingId);
      }
    });
  }

  getBookingsForDate(date: Date): RecentBooking[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return this.recentBookings.filter((booking) => {
      try {
        // Try multiple date fields from the booking
        const dateFields: (string | undefined)[] = [
          (booking as any).wash_date,
          (booking as any).washDate,
          booking.date,
          (booking as any).booking_date,
        ];

        for (const dateField of dateFields) {
          if (!dateField) continue;

          try {
            const bookingDate = new Date(dateField);
            if (isNaN(bookingDate.getTime())) continue;

            // Compare year, month, and day
            const bookingYear = bookingDate.getFullYear();
            const bookingMonth = bookingDate.getMonth();
            const bookingDay = bookingDate.getDate();

            if (
              bookingYear === year &&
              bookingMonth === month &&
              bookingDay === day
            ) {
              return true;
            }
          } catch (e) {
            continue;
          }
        }

        return false;
      } catch (error) {
        console.warn('Error parsing booking date:', booking, error);
        return false;
      }
    });
  }

  formatDateForModal(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
