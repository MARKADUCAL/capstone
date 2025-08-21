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
import { Chart, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { Subject, timer, interval } from 'rxjs';
import { takeUntil, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Register Chart.js components
Chart.register(...registerables);

interface BusinessStats {
  totalCustomers: number;
  totalBookings: number;
  totalEmployees: number;
  customerSatisfaction: number;
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
  vehicleType: string;
  paymentType: string;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface ServiceDistribution {
  service: string;
  count: number;
  percentage: number;
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  businessStats: BusinessStats = {
    totalCustomers: 0,
    totalBookings: 0,
    totalEmployees: 0,
    customerSatisfaction: 4.7,
    totalRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0,
  };

  recentBookings: RecentBooking[] = [];
  revenueData: RevenueData[] = [];
  serviceDistribution: ServiceDistribution[] = [];

  displayedColumns: string[] = [
    'customerName',
    'service',
    'amount',
    'status',
    'date',
    'actions',
  ];

  private revenueChart: Chart | undefined;
  private servicesChart: Chart | undefined;
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;

  // Loading states
  isLoading = true;
  isLoadingStats = true;
  isLoadingBookings = true;
  isLoadingCharts = true;

  // Auto-refresh interval (5 minutes)
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();

    // Set up auto-refresh
    interval(this.REFRESH_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });

    // Only initialize charts if in browser environment
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up charts
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.servicesChart) {
      this.servicesChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.isLoadingStats = true;
    this.isLoadingBookings = true;

    // Load dashboard summary first for better performance
    Promise.all([
      this.loadDashboardSummary(),
      this.loadRecentBookings(),
      this.loadRevenueData(),
      this.loadServiceDistribution(),
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
            const data = response.payload;
            this.businessStats = {
              totalCustomers: data.total_customers || 0,
              totalBookings: data.total_bookings || 0,
              totalEmployees: data.total_employees || 0,
              customerSatisfaction: data.customer_satisfaction || 4.7,
              totalRevenue: data.total_revenue || 0,
              completedBookings: data.completed_bookings || 0,
              pendingBookings: data.pending_bookings || 0,
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
            this.recentBookings = bookings.slice(0, 10).map((booking: any) => ({
              id: booking.id,
              customerName: booking.customerName || 'Unknown Customer',
              service: booking.serviceName || 'Unknown Service',
              status: booking.status || 'Pending',
              amount: booking.price || 0,
              date: booking.washDate || 'Unknown Date',
              vehicleType: booking.vehicleType || 'Unknown',
              paymentType: booking.paymentType || 'Unknown',
            }));

            // Calculate total revenue
            this.businessStats.totalRevenue = bookings.reduce(
              (total: number, booking: any) => {
                return total + (booking.price || 0);
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

  private loadRevenueData(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_revenue_analytics`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            const data = response.payload.revenue_data || [];
            this.revenueData = data.map((item: any) => ({
              month: this.formatMonthLabel(item.month),
              revenue: parseFloat(item.revenue) || 0,
            }));
          } else {
            // Fallback to mock data if API fails
            this.generateMockRevenueData();
          }
        },
        error: (error) => {
          console.error('Error fetching revenue data:', error);
          // Fallback to mock data
          this.generateMockRevenueData();
        },
        complete: () => resolve(),
      });
    });
  }

  private generateMockRevenueData(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.revenueData = months.map((month) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
    }));
  }

  private formatMonthLabel(monthString: string): string {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  private loadServiceDistribution(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/get_service_distribution`).subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            const data = response.payload.service_distribution || [];
            this.serviceDistribution = data.map((item: any) => ({
              service: item.service_name || 'Unknown Service',
              count: parseInt(item.booking_count) || 0,
              percentage: parseFloat(item.percentage) || 0,
            }));
          } else {
            // Use default distribution if API fails
            this.generateDefaultServiceDistribution();
          }
        },
        error: (error) => {
          console.error('Error fetching service distribution:', error);
          // Use default distribution if API fails
          this.generateDefaultServiceDistribution();
        },
        complete: () => resolve(),
      });
    });
  }

  private generateDefaultServiceDistribution(): void {
    this.serviceDistribution = [
      { service: 'Premium Wash', count: 35, percentage: 35 },
      { service: 'Full Service', count: 25, percentage: 25 },
      { service: 'Basic Wash', count: 20, percentage: 20 },
      { service: 'Interior Clean', count: 20, percentage: 20 },
    ];
  }

  private initializeCharts(): void {
    // Only proceed if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingCharts = true;

    // Revenue Chart
    const revenueCtx = document.getElementById(
      'revenueChart'
    ) as HTMLCanvasElement;
    if (revenueCtx) {
      if (this.revenueChart) {
        this.revenueChart.destroy();
      }

      const revenueLabels = this.revenueData.map((item) => item.month);
      const revenueValues = this.revenueData.map((item) => item.revenue);

      this.revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: revenueLabels,
          datasets: [
            {
              label: 'Monthly Revenue',
              data: revenueValues,
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#1976d2',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: { size: 12 },
              },
            },
            title: {
              display: true,
              text: 'Revenue Trend',
              font: { size: 16, weight: 'bold' },
              padding: { top: 20, bottom: 20 },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value.toLocaleString(),
              },
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
            },
            x: {
              grid: { display: false },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    }

    // Services Distribution Chart
    const servicesCtx = document.getElementById(
      'servicesChart'
    ) as HTMLCanvasElement;
    if (servicesCtx) {
      if (this.servicesChart) {
        this.servicesChart.destroy();
      }

      const serviceLabels = this.serviceDistribution.map(
        (item) => item.service
      );
      const serviceData = this.serviceDistribution.map((item) => item.count);
      const colors = [
        'rgba(25, 118, 210, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(0, 150, 136, 0.8)',
      ];

      this.servicesChart = new Chart(servicesCtx, {
        type: 'doughnut',
        data: {
          labels: serviceLabels,
          datasets: [
            {
              data: serviceData,
              backgroundColor: colors.slice(0, serviceLabels.length),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: { size: 12 },
                generateLabels: (chart) => {
                  const data = chart.data;
                  if (data.labels && data.datasets) {
                    return data.labels.map((label, i) => {
                      const dataset = data.datasets[0];
                      const value = dataset.data[i] as number;
                      const total = (dataset.data as number[]).reduce(
                        (a: number, b: number) => a + b,
                        0
                      );
                      const percentage =
                        total > 0 ? Math.round((value / total) * 100) : 0;
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle:
                          (dataset.backgroundColor as string[])?.[i] ||
                          '#000000',
                        strokeStyle: dataset.borderColor as string,
                        lineWidth: dataset.borderWidth as number,
                        hidden: false,
                        index: i,
                      };
                    });
                  }
                  return [];
                },
              },
            },
            title: {
              display: true,
              text: 'Services Distribution',
              font: { size: 16, weight: 'bold' },
              padding: { top: 20, bottom: 20 },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                  const percentage =
                    total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} bookings (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    }

    this.isLoadingCharts = false;
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
    // TODO: Implement booking details view
    console.log('View booking details:', bookingId);
    this.showInfo('Booking details feature coming soon!');
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
    this.showSuccess('Dashboard refreshed successfully');
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
}
