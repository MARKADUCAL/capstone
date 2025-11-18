import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables,
} from 'chart.js';
import { MatTabChangeEvent } from '@angular/material/tabs';
import {
  ReportingService,
  RevenuePoint,
  ServiceDistributionItem,
  WeeklyBookingPoint,
} from '../../../services/reporting.service';

// Register Chart.js components
Chart.register(...registerables);

interface RevenueData {
  weekly: number;
  monthly: number;
}

interface ServiceStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  declinedBookings: number;
}

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit, AfterViewInit {
  revenueData: RevenueData = {
    weekly: 0,
    monthly: 0,
  };

  serviceStats: ServiceStats = {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    declinedBookings: 0,
  };

  private revenueChart: Chart | undefined;
  private serviceChart: Chart | undefined;
  private bookingsChart: Chart | undefined;

  // Data from API for charts
  private revenueLabels: string[] = [];
  private revenueValues: number[] = [];
  private serviceLabels: string[] = [];
  private serviceCounts: number[] = [];
  private weeklyBookingLabels: string[] = [];
  private weeklyBookingValues: number[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private reportingService: ReportingService
  ) {}

  ngOnInit(): void {
    // Fetch live data
    this.loadDashboardSummary();
    this.loadRevenueAnalytics();
    this.loadServiceDistribution();
    this.loadWeeklyBookings();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    if (isPlatformBrowser(this.platformId)) {
      // Wait for Material tab content to be rendered
      setTimeout(() => {
        // Reinitialize the chart in the selected tab
        switch (event.index) {
          case 0:
            console.log('Switching to Revenue Trend tab');
            this.initializeRevenueChart();
            break;
          case 1:
            console.log('Switching to Service Distribution tab');
            // Double check canvas exists before initializing
            const serviceCanvas = document.getElementById('serviceChart');
            if (serviceCanvas) {
              this.initializeServiceChart();
            } else {
              setTimeout(() => this.initializeServiceChart(), 100);
            }
            break;
          case 2:
            console.log('Switching to Weekly Bookings tab');
            // Double check canvas exists before initializing
            const bookingsCanvas = document.getElementById('bookingsChart');
            if (bookingsCanvas) {
              this.initializeBookingsChart();
            } else {
              setTimeout(() => this.initializeBookingsChart(), 100);
            }
            break;
        }
      }, 300); // Longer delay to ensure tab content is fully rendered
    }
  }

  private initializeCharts(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize only the first visible chart (Revenue Trend)
      // Other charts will be initialized when their tabs are selected
      setTimeout(() => {
        this.initializeRevenueChart();
      }, 200);
      // Initialize others with a delay to ensure DOM is ready
      setTimeout(() => {
        this.initializeServiceChart();
        this.initializeBookingsChart();
      }, 500);
    }
  }

  private loadDashboardSummary(): void {
    this.reportingService.getDashboardSummary().subscribe({
      next: (summary) => {
        if (!summary) {
          console.warn('Dashboard summary is null or undefined');
          return;
        }
        console.log('Dashboard summary received:', summary);
        this.serviceStats.totalBookings = Number(summary.total_bookings) || 0;
        this.serviceStats.completedBookings =
          Number(summary.completed_bookings) || 0;
        this.serviceStats.pendingBookings =
          Number(summary.pending_bookings) || 0;
        this.serviceStats.cancelledBookings =
          Number(summary.cancelled_bookings ?? summary.canceled_bookings) || 0;
        this.serviceStats.declinedBookings =
          Number(summary.declined_bookings) || 0;
        this.revenueData.weekly = Number(summary.weekly_revenue) || 0;
        this.revenueData.monthly = Number(summary.monthly_revenue) || 0;
        console.log('Service stats updated:', this.serviceStats);
      },
      error: (err) => {
        console.error('Error loading dashboard summary:', err);
      },
    });
  }

  private loadRevenueAnalytics(): void {
    this.reportingService.getRevenueAnalytics().subscribe({
      next: (points) => {
        console.log('Revenue analytics points received:', points);
        this.revenueLabels = points.map((p) => p.month);
        this.revenueValues = points.map((p) => Number(p.revenue) || 0);
        console.log('Processed revenue data:', {
          labels: this.revenueLabels,
          values: this.revenueValues,
        });
        if (isPlatformBrowser(this.platformId)) {
          // Update existing chart or initialize if not exists
          if (this.revenueChart) {
            this.updateRevenueChart();
          } else {
            setTimeout(() => this.initializeRevenueChart(), 100);
          }
        }
      },
      error: (err) => {
        console.error('Error loading revenue analytics:', err);
        // Use fallback data if API fails
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initializeRevenueChart(), 100);
        }
      },
    });
  }

  private mapServiceNameToPackageLabel(serviceName: string): string {
    if (!serviceName) return serviceName;

    const serviceNameLower = serviceName.toLowerCase().trim();

    // Backend now returns mapped names, but handle edge cases and legacy data
    // Check if already in correct format
    if (
      serviceNameLower === 'wash only' ||
      serviceNameLower === 'wash / vacuum' ||
      serviceNameLower === 'wash / vacuum / hand wax' ||
      serviceNameLower === 'wash / vacuum / buffing wax'
    ) {
      return serviceName; // Already correctly formatted
    }

    // Map package codes and service names to package labels (for legacy data)
    if (
      serviceNameLower.includes('p1') ||
      serviceNameLower.includes('wash only')
    ) {
      return 'Wash only';
    }
    if (
      serviceNameLower.includes('p2') ||
      serviceNameLower.includes('wash + vacuum') ||
      serviceNameLower.includes('wash/vacuum') ||
      serviceNameLower.includes('wash / vacuum')
    ) {
      return 'Wash / Vacuum';
    }
    if (
      serviceNameLower.includes('p3') ||
      serviceNameLower.includes('hand wax')
    ) {
      return 'Wash / Vacuum / Hand Wax';
    }
    if (
      serviceNameLower.includes('p4') ||
      serviceNameLower.includes('buffing wax')
    ) {
      return 'Wash / Vacuum / Buffing Wax';
    }

    // Fallback: return original name if no match
    return serviceName;
  }

  private loadServiceDistribution(): void {
    this.reportingService.getServiceDistribution().subscribe({
      next: (items) => {
        console.log('Service distribution data received:', items);
        // Map service names to package labels
        this.serviceLabels = items.map((i) =>
          this.mapServiceNameToPackageLabel(i.service_name)
        );
        this.serviceCounts = items.map((i) => Number(i.booking_count) || 0);
        console.log('Processed service distribution:', {
          labels: this.serviceLabels,
          counts: this.serviceCounts,
        });
        if (isPlatformBrowser(this.platformId)) {
          // Update existing chart or initialize if not exists
          if (this.serviceChart) {
            this.updateServiceChart();
          } else {
            setTimeout(() => this.initializeServiceChart(), 100);
          }
        }
      },
      error: (err) => {
        console.error('Error loading service distribution:', err);
        // Use fallback data if API fails
        this.serviceLabels = [];
        this.serviceCounts = [];
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initializeServiceChart(), 100);
        }
      },
    });
  }

  private loadWeeklyBookings(): void {
    this.reportingService.getWeeklyBookings().subscribe({
      next: (points) => {
        console.log('Weekly bookings data received:', points);

        // Map day names to short format (Mon, Tue, etc.)
        const dayMap: { [key: string]: string } = {
          Monday: 'Mon',
          Tuesday: 'Tue',
          Wednesday: 'Wed',
          Thursday: 'Thu',
          Friday: 'Fri',
          Saturday: 'Sat',
          Sunday: 'Sun',
          Mon: 'Mon',
          Tue: 'Tue',
          Wed: 'Wed',
          Thu: 'Thu',
          Fri: 'Fri',
          Sat: 'Sat',
          Sun: 'Sun',
        };

        // Normalize day names (handle both full and short names)
        const normalizeDay = (day: string): string => {
          const normalized = day.trim();
          if (dayMap[normalized]) {
            return dayMap[normalized];
          }
          // Try to match partial names
          const lower = normalized.toLowerCase();
          for (const [full, short] of Object.entries(dayMap)) {
            if (
              full.toLowerCase().startsWith(lower) ||
              lower.startsWith(full.toLowerCase().substring(0, 3))
            ) {
              return short;
            }
          }
          return normalized.substring(0, 3);
        };

        // Ensure we have data for all 7 days in order
        const orderedDays = [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ];
        const bookingMap = new Map<string, number>();

        points.forEach((p) => {
          const normalizedDay = normalizeDay(p.day);
          const count = Number(p.bookings_count) || 0;
          // Map to full day name for lookup
          const fullDay = orderedDays.find(
            (d) =>
              dayMap[d] === normalizedDay ||
              d.toLowerCase().startsWith(normalizedDay.toLowerCase())
          );
          if (fullDay) {
            bookingMap.set(fullDay, count);
          } else {
            // Fallback: try direct match
            bookingMap.set(p.day, count);
          }
        });

        this.weeklyBookingLabels = orderedDays.map(
          (day) => dayMap[day] || day.substring(0, 3)
        );
        this.weeklyBookingValues = orderedDays.map((day) => {
          const value = bookingMap.get(day);
          return value !== undefined ? value : 0;
        });

        console.log('Processed weekly bookings:', {
          labels: this.weeklyBookingLabels,
          values: this.weeklyBookingValues,
        });

        if (isPlatformBrowser(this.platformId)) {
          // Update existing chart or initialize if not exists
          if (this.bookingsChart) {
            this.updateBookingsChart();
          } else {
            setTimeout(() => this.initializeBookingsChart(), 100);
          }
        }
      },
      error: (err) => {
        console.error('Error loading weekly bookings:', err);
        // Use fallback data if API fails
        this.weeklyBookingLabels = [
          'Mon',
          'Tue',
          'Wed',
          'Thu',
          'Fri',
          'Sat',
          'Sun',
        ];
        this.weeklyBookingValues = [0, 0, 0, 0, 0, 0, 0];
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initializeBookingsChart(), 100);
        }
      },
    });
  }

  private initializeRevenueChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Revenue Trend Chart
    const revenueCtx = document.getElementById(
      'revenueChart'
    ) as HTMLCanvasElement;
    if (!revenueCtx) {
      console.warn('Revenue chart canvas element not found');
      return;
    }

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const labels = this.revenueLabels.length
      ? this.revenueLabels
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = this.revenueValues.length
      ? this.revenueValues
      : [65000, 59000, 80000, 81000, 56000, 75000];

    console.log('Initializing revenue chart with:', { labels, data });

    this.revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monthly Revenue',
            data: data,
            fill: true,
            tension: 0.4,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointBackgroundColor: '#1976d2',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
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
              font: {
                size: 12,
              },
            },
          },
          title: {
            display: true,
            text: 'Revenue Trend',
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 20,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y || 0;
                return `Revenue: ₱${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === 'number') {
                  return '₱' + value.toLocaleString();
                }
                return '₱' + value;
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  private updateRevenueChart(): void {
    if (!this.revenueChart || !isPlatformBrowser(this.platformId)) return;

    const labels = this.revenueLabels.length
      ? this.revenueLabels
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = this.revenueValues.length
      ? this.revenueValues
      : [65000, 59000, 80000, 81000, 56000, 75000];

    this.revenueChart.data.labels = labels;
    this.revenueChart.data.datasets[0].data = data;
    this.revenueChart.update('active');
  }

  private initializeServiceChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Service Distribution Chart
    const serviceCtx = document.getElementById(
      'serviceChart'
    ) as HTMLCanvasElement;
    if (!serviceCtx) {
      console.warn('Service chart canvas element not found');
      return;
    }

    if (this.serviceChart) {
      this.serviceChart.destroy();
    }

    // Ensure we have matching labels and data
    const labels = this.serviceLabels.length
      ? this.serviceLabels
      : [
          'Wash only',
          'Wash / Vacuum',
          'Wash / Vacuum / Hand Wax',
          'Wash / Vacuum / Buffing Wax',
        ];
    const data = this.serviceCounts.length
      ? this.serviceCounts
      : [30, 25, 25, 20];

    // Ensure we have enough colors for all labels
    const colors = [
      'rgba(25, 118, 210, 0.8)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(255, 160, 0, 0.8)',
      'rgba(244, 67, 54, 0.8)',
      'rgba(156, 39, 176, 0.8)',
      'rgba(0, 188, 212, 0.8)',
      'rgba(255, 87, 34, 0.8)',
      'rgba(121, 85, 72, 0.8)',
    ];

    console.log('Initializing service chart with:', { labels, data });

    this.serviceChart = new Chart(serviceCtx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#ffffff',
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
              font: {
                size: 12,
              },
              usePointStyle: true,
            },
          },
          title: {
            display: true,
            text: 'Service Distribution',
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 20,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  private updateServiceChart(): void {
    if (!this.serviceChart || !isPlatformBrowser(this.platformId)) return;

    const labels = this.serviceLabels.length
      ? this.serviceLabels
      : [
          'Wash only',
          'Wash / Vacuum',
          'Wash / Vacuum / Hand Wax',
          'Wash / Vacuum / Buffing Wax',
        ];
    const data = this.serviceCounts.length
      ? this.serviceCounts
      : [30, 25, 25, 20];

    // Ensure we have enough colors for all labels
    const colors = [
      'rgba(25, 118, 210, 0.8)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(255, 160, 0, 0.8)',
      'rgba(244, 67, 54, 0.8)',
      'rgba(156, 39, 176, 0.8)',
      'rgba(0, 188, 212, 0.8)',
      'rgba(255, 87, 34, 0.8)',
      'rgba(121, 85, 72, 0.8)',
    ];

    this.serviceChart.data.labels = labels;
    this.serviceChart.data.datasets[0].data = data;
    this.serviceChart.data.datasets[0].backgroundColor = colors.slice(
      0,
      labels.length
    );
    this.serviceChart.update('active');
  }

  private initializeBookingsChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Bookings Chart
    const bookingsCtx = document.getElementById(
      'bookingsChart'
    ) as HTMLCanvasElement;
    if (!bookingsCtx) {
      console.warn('Bookings chart canvas element not found');
      return;
    }

    if (this.bookingsChart) {
      this.bookingsChart.destroy();
    }

    // Ensure we have valid data
    const labels = this.weeklyBookingLabels.length
      ? this.weeklyBookingLabels
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = this.weeklyBookingValues.length
      ? this.weeklyBookingValues
      : [0, 0, 0, 0, 0, 0, 0];

    console.log('Initializing bookings chart with:', { labels, data });

    this.bookingsChart = new Chart(bookingsCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Bookings',
            data: data,
            backgroundColor: 'rgba(25, 118, 210, 0.8)',
            borderRadius: 6,
            borderColor: '#1976d2',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(25, 118, 210, 1)',
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
              font: {
                size: 12,
              },
              usePointStyle: true,
            },
          },
          title: {
            display: true,
            text: 'Weekly Booking Distribution',
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 20,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y || 0;
                return `Bookings: ${value}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5,
              precision: 0,
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  private updateBookingsChart(): void {
    if (!this.bookingsChart || !isPlatformBrowser(this.platformId)) return;

    const labels = this.weeklyBookingLabels.length
      ? this.weeklyBookingLabels
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = this.weeklyBookingValues.length
      ? this.weeklyBookingValues
      : [0, 0, 0, 0, 0, 0, 0];

    this.bookingsChart.data.labels = labels;
    this.bookingsChart.data.datasets[0].data = data;
    this.bookingsChart.update('active');
  }

  private getChartOptions(): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Roboto', sans-serif",
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#2c3e50',
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyColor: '#2c3e50',
          bodyFont: {
            size: 13,
          },
          padding: 12,
          boxPadding: 8,
          borderColor: '#e9ecef',
          borderWidth: 1,
          displayColors: true,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
        y: {
          grid: {
            color: '#e9ecef',
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
      },
      elements: {
        line: {
          tension: 0.4,
        },
        point: {
          radius: 4,
          hitRadius: 8,
          hoverRadius: 6,
        },
      },
    };
  }

  getCompletionRate(): number {
    if (!this.serviceStats.totalBookings) {
      return 0;
    }
    return (
      (this.serviceStats.completedBookings / this.serviceStats.totalBookings) *
      100
    );
  }
}
