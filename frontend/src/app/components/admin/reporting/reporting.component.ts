import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import jsPDF from 'jspdf';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables,
} from 'chart.js';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';
import {
  ReportingService,
  ReportSummary,
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
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit, AfterViewInit {
  revenueData: RevenueData = {
    weekly: 0,
    monthly: 0,
  };

  // Specific month revenue selector
  selectedRevenueMonth: string = '';
  selectedRevenueMonthDate: Date | null = null;
  specificMonthRevenue: number = 0;
  specificMonthBookings: number = 0;
  revenueMonthDateRange: string = '';

  // Specific week revenue selector
  selectedRevenueWeek: string = '';
  selectedRevenueWeekDate: Date | null = null;
  specificWeekRevenue: number = 0;
  specificWeekBookings: number = 0;
  revenueWeekDateRange: string = '';
  weeklyRevenueData: Array<{
    week: number;
    startDate: string;
    endDate: string;
    revenue: number;
    bookings: number;
  }> = [];

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
  private monthlyBookingLabels: string[] = [];
  private monthlyBookingValues: number[] = [];

  // Year selector (for Weekly and Monthly booking charts)
  selectedYear: number = new Date().getFullYear();
  selectedYearDate: Date = new Date(new Date().getFullYear(), 0, 1);
  availableYears: number[] = [];

  // Week selector
  selectedWeek: string = '';
  private currentWeekStart: Date = new Date();

  // Month selector
  selectedMonth: string = '';
  private currentMonthStart: Date = new Date();

  // Report PDF selectors
  selectedReportMonth: string = '';
  selectedReportWeek: string = '';
  reportType: 'weekly' | 'monthly' = 'weekly';
  selectedReportMonthDate: Date | null = null;
  selectedReportWeekDate: Date | null = null;

  // Track current bookings view type
  private currentBookingsType: 'weekly' | 'monthly' = 'weekly';

  isGeneratingPDF: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private reportingService: ReportingService,
  ) {}

  ngOnInit(): void {
    // Initialize year selector first (used by week/month)
    this.initializeYearSelector();
    // Initialize week and month selectors to current week/month
    this.initializeWeekSelector();
    this.initializeMonthSelector();
    this.initializeRevenueMonthSelector();
    this.initializeRevenueWeekSelector();
    this.initializeReportSelectors();

    // Fetch live data
    this.loadDashboardSummary();
    this.loadRevenueAnalytics();
    this.loadServiceDistribution();
    this.loadWeeklyBookings();
    this.loadMonthlyBookings();
    this.loadSpecificMonthRevenue();
    this.loadSpecificWeekRevenue();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Delay chart initialization to allow time for data to load and DOM to be ready
      setTimeout(() => {
        this.initializeCharts();
      }, 500);
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
            const serviceCanvas = document.getElementById('serviceChart');
            if (serviceCanvas) {
              this.initializeServiceChart();
            } else {
              setTimeout(() => this.initializeServiceChart(), 100);
            }
            break;
          case 2:
            console.log('Switching to Weekly Bookings tab');
            this.currentBookingsType = 'weekly';
            const weeklyCanvas = document.getElementById('weeklyBookingsChart');
            if (weeklyCanvas) {
              this.initializeWeeklyBookingsChart();
            } else {
              setTimeout(() => this.initializeWeeklyBookingsChart(), 100);
            }
            break;
          case 3:
            console.log('Switching to Monthly Bookings tab');
            this.currentBookingsType = 'monthly';
            const monthlyCanvas = document.getElementById(
              'monthlyBookingsChart',
            );
            if (monthlyCanvas) {
              this.initializeMonthlyBookingsChart();
            } else {
              setTimeout(() => this.initializeMonthlyBookingsChart(), 100);
            }
            break;
        }
      }, 300); // Longer delay to ensure tab content is fully rendered
    }
  }

  private initializeCharts(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize the first visible chart (Revenue Trend)
      // Wait to ensure canvas is rendered and has proper dimensions
      this.initializeRevenueChart();
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
    this.reportingService.getRevenueAnalytics(this.selectedYear).subscribe({
      next: (points) => {
        console.log('Revenue analytics points received:', points);
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        // Always render a full Jan–Dec x-axis. Any missing months become 0.
        const monthRevenue = Array<number>(12).fill(0);

        const getMonthIndex = (raw: string): number | null => {
          if (!raw) return null;
          const value = String(raw).trim();

          // Formats supported: "YYYY-MM", "MM", "M", "January", "Jan"
          if (value.includes('-')) {
            const parts = value.split('-');
            const maybeMonth = parts[parts.length - 1];
            const monthIndex = parseInt(maybeMonth, 10) - 1;
            return monthIndex >= 0 && monthIndex < 12 ? monthIndex : null;
          }

          const numeric = parseInt(value, 10);
          if (!Number.isNaN(numeric)) {
            const monthIndex = numeric - 1;
            return monthIndex >= 0 && monthIndex < 12 ? monthIndex : null;
          }

          const fullIdx = months.findIndex(
            (m) => m.toLowerCase() === value.toLowerCase(),
          );
          if (fullIdx >= 0) return fullIdx;

          const shortIdx = months.findIndex(
            (m) => m.substring(0, 3).toLowerCase() === value.substring(0, 3).toLowerCase(),
          );
          return shortIdx >= 0 ? shortIdx : null;
        };

        if (!points || points.length === 0) {
          console.warn('No revenue data received from API');
          // Keep 12 labels visible with 0s (no fake data).
        } else {
          points.forEach((p) => {
            const idx = getMonthIndex(p.month);
            if (idx === null) return;
            monthRevenue[idx] += Number(p.revenue) || 0;
          });
        }

        this.revenueLabels = months;
        this.revenueValues = monthRevenue;

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
        // Keep 12 labels visible even if API fails.
        this.revenueLabels = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        this.revenueValues = Array(12).fill(0);
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initializeRevenueChart(), 100);
        }
      },
    });
  }

  private formatMonthLabel(dateString: string): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Handle YYYY-MM format (e.g., "2025-11")
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      return months[monthIndex] || dateString;
    }

    // Handle month number format (e.g., "11")
    const monthIndex = parseInt(dateString, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return months[monthIndex];
    }

    // Return as-is if unable to parse
    return dateString;
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
          this.mapServiceNameToPackageLabel(i.service_name),
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
    // Calculate week start and end from currentWeekStart
    const weekStart = new Date(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    console.log('Loading bookings for week:', {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    });

    this.reportingService
      .getWeeklyBookingsByDateRange(weekStart, weekEnd)
      .subscribe({
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
          };

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
            const day = p.day.trim();
            const count = Number(p.bookings_count) || 0;
            bookingMap.set(day, count);
          });

          this.weeklyBookingLabels = orderedDays.map(
            (day) => dayMap[day] || day.substring(0, 3),
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
            if (this.bookingsChart && this.currentBookingsType === 'weekly') {
              this.updateWeeklyBookingsChart();
            }
          }
        },
        error: (err) => {
          console.error('Error loading weekly bookings:', err);
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
        },
      });
  }

  private loadMonthlyBookings(): void {
    if (!this.selectedMonth) {
      // Get current month bookings if selectedMonth is not set yet
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      this.selectedMonth = `${year}-${month}`;
    }

    const [year, month] = this.selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    console.log('Loading bookings for month:', {
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
    });

    this.reportingService
      .getMonthlyBookingsByDateRange(monthStart, monthEnd)
      .subscribe({
        next: (points) => {
          console.log('Monthly bookings data received:', points);
          if (points && points.length > 0) {
            this.processMonthlyBookings(points, monthStart, monthEnd);
          } else {
            console.warn('No bookings data received');
            // Use fallback data
            this.weeklyBookingLabels = [];
            this.weeklyBookingValues = [];
            for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
              this.weeklyBookingLabels.push(i.toString());
              this.weeklyBookingValues.push(0);
            }
          }
        },
        error: (err) => {
          console.error('Error loading monthly bookings:', err);
          // Fallback: show empty data
          this.weeklyBookingLabels = [];
          this.weeklyBookingValues = [];
          const daysInMonth = new Date(year, month, 0).getDate();
          for (let i = 1; i <= daysInMonth; i++) {
            this.weeklyBookingLabels.push(i.toString());
            this.weeklyBookingValues.push(0);
          }
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.initializeBookingsChart(), 100);
          }
        },
      });
  }

  private processMonthlyBookings(
    points: any[],
    monthStart: Date,
    monthEnd: Date,
  ): void {
    console.log('Starting to process monthly bookings with points:', points);

    const daysInMonth = monthEnd.getDate();
    const bookingMap = new Map<number, number>();

    // Initialize all days with 0
    for (let i = 1; i <= daysInMonth; i++) {
      bookingMap.set(i, 0);
    }

    // Populate with actual booking data
    points.forEach((p) => {
      const day = Number(p.day) || 0;
      const count = Number(p.bookings_count) || 0;
      if (day > 0 && day <= daysInMonth) {
        bookingMap.set(day, count);
      }
    });

    // Create labels and values for all days of the month
    this.monthlyBookingLabels = [];
    this.monthlyBookingValues = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.monthlyBookingLabels.push(i.toString());
      this.monthlyBookingValues.push(bookingMap.get(i) || 0);
    }

    console.log('Processed monthly bookings:', {
      labels: this.monthlyBookingLabels,
      values: this.monthlyBookingValues,
    });

    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart && this.currentBookingsType === 'monthly') {
        this.updateMonthlyBookingsChart();
      }
    }
  }

  private initializeRevenueChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Revenue Trend Chart
    const revenueCtx = document.getElementById(
      'revenueChart',
    ) as HTMLCanvasElement;
    if (!revenueCtx) {
      console.warn('Revenue chart canvas element not found');
      return;
    }

    // Ensure parent container has proper height
    const chartWrapper = revenueCtx.closest('.chart-wrapper') as HTMLElement;
    if (chartWrapper) {
      const wrapperHeight = chartWrapper.offsetHeight;
      console.log('Chart wrapper dimensions:', {
        height: wrapperHeight,
        width: chartWrapper.offsetWidth,
      });
      if (wrapperHeight === 0) {
        console.warn('Chart wrapper has no height, will retry');
        setTimeout(() => this.initializeRevenueChart(), 300);
        return;
      }
    }

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const defaultLabels = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const labels = this.revenueLabels.length ? this.revenueLabels : defaultLabels;
    const data = this.revenueValues.length ? this.revenueValues : Array(12).fill(0);

    console.log('Initializing revenue chart with:', {
      labels,
      data,
      canvasHeight: revenueCtx.offsetHeight,
      canvasWidth: revenueCtx.offsetWidth,
    });

    this.revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'My First Dataset',
            data: data,
            fill: true,
            tension: 0.4,
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.15)',
            pointBackgroundColor: '#17a2b8',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              font: {
                size: 12,
                weight: 500,
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 13,
            },
            bodyFont: {
              size: 12,
            },
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
                  return value.toLocaleString();
                }
                return value;
              },
              font: {
                size: 11,
              },
              color: '#666',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.08)',
            },
            border: {
              display: false,
            },
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: 10,
              },
              color: '#666',
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)',
            },
            border: {
              display: false,
            },
          },
        },
      },
    });
  }

  private updateRevenueChart(): void {
    if (!this.revenueChart || !isPlatformBrowser(this.platformId)) return;

    const defaultLabels = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const labels = this.revenueLabels.length ? this.revenueLabels : defaultLabels;
    const data = this.revenueValues.length ? this.revenueValues : Array(12).fill(0);

    this.revenueChart.data.labels = labels;
    this.revenueChart.data.datasets[0].data = data;
    this.revenueChart.update('active');
  }

  private initializeServiceChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Service Distribution Chart
    const serviceCtx = document.getElementById(
      'serviceChart',
    ) as HTMLCanvasElement;
    if (!serviceCtx) {
      console.warn('Service chart canvas element not found');
      return;
    }

    // Ensure parent container has proper height
    const chartWrapper = serviceCtx.closest('.chart-wrapper') as HTMLElement;
    if (chartWrapper && chartWrapper.offsetHeight === 0) {
      console.warn('Service chart wrapper has no height, will retry');
      setTimeout(() => this.initializeServiceChart(), 300);
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
                  0,
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
      labels.length,
    );
    this.serviceChart.update('active');
  }

  private initializeWeeklyBookingsChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Weekly Bookings Chart
    const bookingsCtx = document.getElementById(
      'weeklyBookingsChart',
    ) as HTMLCanvasElement;
    if (!bookingsCtx) {
      console.warn('Weekly bookings chart canvas element not found');
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

    console.log('Initializing weekly bookings chart with:', { labels, data });

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

  private initializeMonthlyBookingsChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Monthly Bookings Chart
    const bookingsCtx = document.getElementById(
      'monthlyBookingsChart',
    ) as HTMLCanvasElement;
    if (!bookingsCtx) {
      console.warn('Monthly bookings chart canvas element not found');
      return;
    }

    if (this.bookingsChart) {
      this.bookingsChart.destroy();
    }

    // Ensure we have valid data
    const labels = this.monthlyBookingLabels.length
      ? this.monthlyBookingLabels
      : Array.from({ length: 30 }, (_, i) => String(i + 1));
    const data = this.monthlyBookingValues.length
      ? this.monthlyBookingValues
      : Array(30).fill(0);

    console.log('Initializing monthly bookings chart with:', { labels, data });

    this.bookingsChart = new Chart(bookingsCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Bookings',
            data: data,
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderRadius: 6,
            borderColor: '#4caf50',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(76, 175, 80, 1)',
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
            text: 'Monthly Booking Distribution',
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

  private initializeBookingsChart(): void {
    // Keep this method for backwards compatibility
    if (this.currentBookingsType === 'weekly') {
      this.initializeWeeklyBookingsChart();
    } else {
      this.initializeMonthlyBookingsChart();
    }
  }

  private updateBookingsChart(): void {
    if (this.currentBookingsType === 'weekly') {
      this.updateWeeklyBookingsChart();
    } else {
      this.updateMonthlyBookingsChart();
    }
  }

  private updateWeeklyBookingsChart(): void {
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

  private updateMonthlyBookingsChart(): void {
    if (!this.bookingsChart || !isPlatformBrowser(this.platformId)) return;

    const labels = this.monthlyBookingLabels.length
      ? this.monthlyBookingLabels
      : Array.from({ length: 30 }, (_, i) => String(i + 1));
    const data = this.monthlyBookingValues.length
      ? this.monthlyBookingValues
      : Array(30).fill(0);

    console.log('Updating monthly bookings chart with:', { labels, data });
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

  // PDF Generation Methods - LeydiBoss Car Wash style
  async generatePDF(
    reportType: 'weekly' | 'monthly',
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.error('PDF generation is only available in browser');
      return;
    }

    if (this.isGeneratingPDF) return;

    const isWeekly = reportType === 'weekly';
    const dateStr = isWeekly ? this.selectedReportWeek : this.selectedReportMonth;
    if (!dateStr) {
      alert('Please select a ' + (isWeekly ? 'week' : 'month') + ' for the report.');
      return;
    }

    this.isGeneratingPDF = true;

    try {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      if (isWeekly) {
        const [year, weekStr] = dateStr.split('-W').map(Number);
        const weekStart = this.getWeekStartDate(year, weekStr);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        startDate = weekStart;
        endDate = weekEnd;
        periodLabel = this.getReportWeekDateRange();
      } else {
        const [year, month] = dateStr.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        periodLabel = `${months[month - 1]} ${year}`;
      }

      let report: ReportSummary;
      try {
        report = await firstValueFrom(
          this.reportingService.getReportSummary(startDate, endDate),
        );
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'status' in err
            ? `Report API error (status ${(err as { status?: number }).status}). Ensure the backend is deployed with get_report_summary.`
            : err && typeof err === 'object' && 'message' in err
              ? String((err as { message?: string }).message)
              : 'Failed to load report data.';
        console.error('Report fetch error:', err);
        alert(msg);
        return;
      }

      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let y = margin;

      const PESO = 'Php '; // Philippine Peso (₱ may not render in jsPDF default fonts)
      const DARK_BLUE: [number, number, number] = [25, 47, 74]; // #192F4A
      const LIGHT_BLUE_FILL: [number, number, number] = [220, 235, 255];
      const GRAY: [number, number, number] = [100, 100, 100];
      const LIGHT_GRAY: [number, number, number] = [180, 180, 180];

      // Load logo
      let logoData: string | null = null;
      try {
        const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        const logoUrl = `${window.location.origin}${baseHref.replace(/\/$/, '')}/assets/logo3.png`;
        const res = await fetch(logoUrl);
        if (res.ok) {
          const blob = await res.blob();
          logoData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        /* logo optional */
      }

      // Header (dark blue)
      pdf.setFillColor(...DARK_BLUE);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      if (logoData) {
        const logoW = 28;
        const logoH = 28;
        pdf.addImage(logoData, 'PNG', margin, 6, logoW, logoH);
      }
      pdf.setFontSize(8);
      pdf.text('LEYDIBOSS CAR WASH BOOKING SYSTEM', logoData ? margin + 32 : margin, 12);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text(isWeekly ? 'Weekly Report' : 'Monthly Report', logoData ? margin + 32 : margin, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(periodLabel, logoData ? margin + 32 : margin, 36);
      // OFFICIAL badge and Generated (top right)
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(pageWidth - margin - 32, 10, 32, 10, 'S');
      pdf.setFontSize(9);
      pdf.text('OFFICIAL', pageWidth - margin - 16, 16.5, { align: 'center' });
      pdf.text('Generated: ' + generatedDate, pageWidth - margin - 16, 30, { align: 'center' });
      y = 60;

      // Section: — BOOKING SUMMARY
      pdf.setTextColor(...GRAY);
      pdf.setFontSize(10);
      pdf.text('— BOOKING SUMMARY', margin, y);
      y += 8;

      const cardH = 22;
      const cardW = (contentWidth - 12) / 4;
      const cards = [
        { val: report.total_bookings, label: 'TOTAL BOOKINGS', highlight: true, dark: true },
        { val: report.completed_bookings, label: 'COMPLETED WASHES', highlight: false },
        { val: report.cancelled_bookings, label: 'CANCELLED', highlight: false },
        { val: report.no_show_bookings, label: 'DECLINED', highlight: false },
      ];
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const x = margin + i * (cardW + 4);
        if (c.dark) {
          pdf.setFillColor(...DARK_BLUE);
          pdf.rect(x, y, cardW, cardH, 'F');
          pdf.setTextColor(255, 255, 255);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x, y, cardW, cardH, 'FD');
          pdf.setTextColor(50, 50, 50);
        }
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(c.val), x + cardW / 2, y + 11, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(c.label, x + cardW / 2, y + 18, { align: 'center' });
      }
      y += cardH + 12;

      // Section: — REVENUE & CUSTOMERS
      pdf.setTextColor(...GRAY);
      pdf.setFontSize(10);
      pdf.text('— REVENUE & CUSTOMERS', margin, y);
      y += 8;

      const revCardW = (contentWidth - 8) / 3;
      const revCards = [
        { val: PESO + report.total_revenue.toLocaleString(), label: 'TOTAL REVENUE', highlight: true },
        { val: PESO + report.avg_per_wash.toLocaleString(), label: 'AVG. PER WASH', highlight: false },
        { val: String(report.new_customers), label: 'NEW CUSTOMERS', highlight: false },
      ];
      for (let i = 0; i < revCards.length; i++) {
        const c = revCards[i];
        const x = margin + i * (revCardW + 4);
        if (c.highlight) {
          pdf.setFillColor(...LIGHT_BLUE_FILL);
          pdf.setDrawColor(150, 180, 220);
          pdf.rect(x, y, revCardW, cardH, 'FD');
          pdf.setTextColor(25, 47, 74);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x, y, revCardW, cardH, 'FD');
          pdf.setTextColor(50, 50, 50);
        }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(c.val, x + revCardW / 2, y + 11, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(c.label, x + revCardW / 2, y + 18, { align: 'center' });
      }
      y += cardH + 14;

      // Section: — SERVICES BREAKDOWN
      pdf.setTextColor(...GRAY);
      pdf.setFontSize(10);
      pdf.text('— SERVICES BREAKDOWN', margin, y);
      y += 10;

      const maxWashes = Math.max(1, ...report.service_breakdown.map((s) => s.washes));
      for (const svc of report.service_breakdown) {
        const pct = maxWashes > 0 ? (svc.washes / maxWashes) * 100 : 0;
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(svc.service_name, margin, y + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...LIGHT_GRAY);
        pdf.text(`${svc.washes} washes`, margin + 2, y + 9);
        const barW = 60;
        const barH = 4;
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin + 55, y, barW, barH, 'F');
        pdf.setFillColor(...DARK_BLUE);
        pdf.rect(margin + 55, y, (barW * pct) / 100, barH, 'F');
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(9);
        pdf.text(
          `${PESO}${svc.revenue.toLocaleString()} (${svc.percentage}%)`,
          margin + 55 + barW + 6,
          y + 3.5,
        );
        y += 14;
      }
      y += 8;

      // Section: — BOOKING ACTIVITY
      const activityLabel = isWeekly ? '— BOOKING ACTIVITY (BY DAY)' : '— BOOKING ACTIVITY (BY WEEK)';
      pdf.setTextColor(...GRAY);
      pdf.setFontSize(10);
      pdf.text(activityLabel, margin, y);
      y += 10;

      const barLabels = isWeekly
        ? report.daily_bookings.map((d) => d.day)
        : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const barValues = isWeekly
        ? report.daily_bookings.map((d) => d.bookings_count)
        : report.weekly_bookings;
      const maxBar = Math.max(1, ...barValues);
      const barChartW = contentWidth;
      const barChartH = 35;
      const barCount = barLabels.length;
      const barItemW = barChartW / barCount;
      const barMaxH = barChartH - 8;

      for (let i = 0; i < barCount; i++) {
        const v = barValues[i] ?? 0;
        const h = maxBar > 0 ? (v / maxBar) * barMaxH : 0;
        const x = margin + i * barItemW + barItemW * 0.15;
        const w = barItemW * 0.7;
        const barY = y + barMaxH - h;
        pdf.setFillColor(...DARK_BLUE);
        pdf.rect(x, barY, w, Math.max(h, 1), 'F');
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(8);
        pdf.text(barLabels[i], x + w / 2, y + barChartH - 2, { align: 'center' });
      }
      y += barChartH + 16;

      // Footer
      pdf.setTextColor(...LIGHT_GRAY);
      pdf.setFontSize(8);
      pdf.text('LeydiBoss Car Wash Booking System', margin, pageHeight - 10);
      pdf.text('This report is system-generated and for internal use only.', pageWidth - margin, pageHeight - 10, { align: 'right' });

      const fileName = `LeydiBoss_${reportType}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  // Year selector methods
  private initializeYearSelector(): void {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    this.selectedYearDate = new Date(currentYear, 0, 1);
    this.availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
  }

  onYearChange(): void {
    // Reload revenue chart for selected year
    this.loadRevenueAnalytics();

    // Reset week to first week of selected year
    this.selectedWeek = `${this.selectedYear}-W01`;
    const [year, week] = this.selectedWeek.split('-W').map(Number);
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    this.currentWeekStart = new Date(weekStart);
    this.currentWeekStart.setDate(
      this.currentWeekStart.getDate() + (week - 1) * 7,
    );

    // Reset month to January of selected year
    this.selectedMonth = `${this.selectedYear}-01`;
    this.currentMonthStart = new Date(this.selectedYear, 0, 1);

    this.loadWeeklyBookings();
    this.loadMonthlyBookings();

    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart) {
        if (this.currentBookingsType === 'weekly') {
          this.updateWeeklyBookingsChart();
        } else {
          this.updateMonthlyBookingsChart();
        }
      }
    }
  }

  onYearPicked(normalizedYear: Date): void {
    const year = normalizedYear.getFullYear();
    this.selectedYear = year;
    this.selectedYearDate = new Date(year, 0, 1);
    this.onYearChange();
  }

  // Week selector methods
  private initializeWeekSelector(): void {
    const today = new Date();
    this.currentWeekStart = this.getMonday(today);
    this.selectedWeek = this.dateToWeekString(this.currentWeekStart);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private dateToWeekString(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    const weekStr = String(week).padStart(2, '0');
    return `${year}-W${weekStr}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  getWeekDateRange(): string {
    if (!this.selectedWeek) return '';
    const [year, week] = this.selectedWeek.split('-W').map(Number);

    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }

  onWeekChange(): void {
    if (!this.selectedWeek) return;

    const [year, week] = this.selectedWeek.split('-W').map(Number);
    this.selectedYear = year;

    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    this.currentWeekStart = new Date(weekStart);
    this.currentWeekStart.setDate(
      this.currentWeekStart.getDate() + (week - 1) * 7,
    );

    console.log(
      'Week changed to:',
      this.selectedWeek,
      'Starting:',
      this.currentWeekStart,
    );

    // Load bookings for selected week
    this.loadWeeklyBookings();

    // Update chart
    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart && this.currentBookingsType === 'weekly') {
        this.updateWeeklyBookingsChart();
      }
    }
  }

  // Month selector methods
  private initializeMonthSelector(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = `${year}-${month}`;
    this.currentMonthStart = new Date(year, today.getMonth(), 1);
  }

  getMonthDateRange(): string {
    if (!this.selectedMonth) return '';
    const [year, month] = this.selectedMonth.split('-').map(Number);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = monthStart.toLocaleDateString('en-US', options);
    const endStr = monthEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;

    const [year, month] = this.selectedMonth.split('-').map(Number);
    this.selectedYear = year;
    this.currentMonthStart = new Date(year, month - 1, 1);

    console.log(
      'Month changed to:',
      this.selectedMonth,
      'Starting:',
      this.currentMonthStart,
    );

    // Reload the monthly bookings data for the selected month
    this.loadMonthlyBookings();

    // Update chart
    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart && this.currentBookingsType === 'monthly') {
        this.updateMonthlyBookingsChart();
      }
    }
  }

  // Revenue Month Selector Methods
  private initializeRevenueMonthSelector(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.selectedRevenueMonth = `${year}-${month}`;
    this.selectedRevenueMonthDate = new Date(year, today.getMonth(), 1);
  }

  onRevenueMonthChange(): void {
    if (!this.selectedRevenueMonth) return;
    console.log('Revenue month changed to:', this.selectedRevenueMonth);
    this.loadSpecificMonthRevenue();
  }

  onRevenueMonthPicked(normalizedMonth: Date, datepicker: { close: () => void }) {
    const year = normalizedMonth.getFullYear();
    const month = normalizedMonth.getMonth() + 1;
    this.selectedRevenueMonth = `${year}-${String(month).padStart(2, '0')}`;
    this.selectedRevenueMonthDate = new Date(year, month - 1, 1);
    datepicker.close();
    this.onRevenueMonthChange();
  }

  private loadSpecificMonthRevenue(): void {
    if (!this.selectedRevenueMonth) return;

    const [year, month] = this.selectedRevenueMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    console.log('Loading revenue for month:', {
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
    });

    this.reportingService
      .getRevenueByDateRange(monthStart, monthEnd)
      .subscribe({
        next: (data: any) => {
          console.log('Monthly revenue data received:', data);
          this.specificMonthRevenue = data.total_revenue || 0;
          this.specificMonthBookings = data.completed_bookings || 0;
          console.log('Specific month revenue updated:', {
            revenue: this.specificMonthRevenue,
            bookings: this.specificMonthBookings,
          });
        },
        error: (err: any) => {
          console.error('Error loading monthly revenue:', err);
          this.specificMonthRevenue = 0;
          this.specificMonthBookings = 0;
        },
      });

    // Load weekly revenue breakdown
    this.reportingService
      .getWeeklyRevenueByDateRange(monthStart, monthEnd)
      .subscribe({
        next: (data: any) => {
          console.log('Weekly revenue data received:', data);
          this.weeklyRevenueData = data || [];
          console.log('Weekly revenue data updated:', this.weeklyRevenueData);
        },
        error: (err: any) => {
          console.error('Error loading weekly revenue:', err);
          this.weeklyRevenueData = [];
        },
      });
  }

  getRevenueMonthDateRange(): string {
    if (!this.selectedRevenueMonth) return '';
    const [year, month] = this.selectedRevenueMonth.split('-').map(Number);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = monthStart.toLocaleDateString('en-US', options);
    const endStr = monthEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }

  private initializeRevenueWeekSelector(): void {
    const today = new Date();
    const iso = this.getISOWeekYearAndNumber(today);
    this.selectedRevenueWeek = `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
    this.selectedRevenueWeekDate = today;
  }

  private getWeekStartDate(year: number, week: number): Date {
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - jan4.getDay() + 1);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    return weekStart;
  }

  onRevenueWeekChange(): void {
    if (!this.selectedRevenueWeek) return;
    console.log('Revenue week changed to:', this.selectedRevenueWeek);
    this.loadSpecificWeekRevenue();
  }

  onRevenueWeekPicked(date: Date | null): void {
    if (!date) return;
    const iso = this.getISOWeekYearAndNumber(date);
    this.selectedRevenueWeek = `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
    this.selectedRevenueWeekDate = date;
    this.onRevenueWeekChange();
  }

  private loadSpecificWeekRevenue(): void {
    if (!this.selectedRevenueWeek) return;

    const [yearWeekStr, weekStr] = this.selectedRevenueWeek.split('-W');
    const year = parseInt(yearWeekStr, 10);
    const week = parseInt(weekStr, 10);

    const weekStart = this.getWeekStartDate(year, week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    console.log('Loading revenue for week:', {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    });

    this.reportingService.getRevenueByDateRange(weekStart, weekEnd).subscribe({
      next: (data: any) => {
        console.log('Weekly revenue data received:', data);
        this.specificWeekRevenue = data.total_revenue || 0;
        this.specificWeekBookings = data.completed_bookings || 0;
        this.revenueWeekDateRange = this.getRevenueWeekDateRange();
        console.log('Specific week revenue updated:', {
          revenue: this.specificWeekRevenue,
          bookings: this.specificWeekBookings,
        });
      },
      error: (err: any) => {
        console.error('Error loading weekly revenue:', err);
        this.specificWeekRevenue = 0;
        this.specificWeekBookings = 0;
      },
    });

    // Load daily revenue breakdown for the selected week
    this.reportingService
      .getDailyRevenueByDateRange(weekStart, weekEnd)
      .subscribe({
        next: (data: any) => {
          console.log('Daily revenue data for week received:', data);
          this.weeklyRevenueData = (data || []).map((day: any) => ({
            week: this.getWeekNumber(
              new Date(
                weekStart.getFullYear(),
                weekStart.getMonth(),
                weekStart.getDate() + parseInt(day.day, 10) - 1,
              ),
            ),
            startDate: new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate() + parseInt(day.day, 10) - 1,
            )
              .toISOString()
              .split('T')[0],
            endDate: new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate() + parseInt(day.day, 10) - 1,
            )
              .toISOString()
              .split('T')[0],
            revenue: day.revenue,
            bookings: day.bookings,
          }));
          console.log(
            'Daily revenue data updated for week:',
            this.weeklyRevenueData,
          );
        },
        error: (err: any) => {
          console.error('Error loading daily revenue for week:', err);
          this.weeklyRevenueData = [];
        },
      });
  }

  getRevenueWeekDateRange(): string {
    if (!this.selectedRevenueWeek) return '';
    const [yearWeekStr, weekStr] = this.selectedRevenueWeek.split('-W');
    const year = parseInt(yearWeekStr, 10);
    const week = parseInt(weekStr, 10);

    const weekStart = this.getWeekStartDate(year, week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }

  private getISOWeekYearAndNumber(date: Date): { year: number; week: number } {
    // ISO week: week starts Monday, week 1 contains Jan 4.
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year, week };
  }

  private initializeReportSelectors(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.selectedReportMonth = `${year}-${month}`;
    this.selectedReportMonthDate = new Date(year, today.getMonth(), 1);

    // Get current week
    const currentDate = new Date();
    const weekStart = this.getWeekStart(currentDate);
    const weekYear = weekStart.getFullYear();
    const weekNumber = this.getWeekNumber(weekStart);
    const weekStr = String(weekNumber).padStart(2, '0');
    this.selectedReportWeek = `${weekYear}-W${weekStr}`;
    this.selectedReportWeekDate = currentDate;
  }

  onReportMonthPicked(normalizedMonth: Date, datepicker: { close: () => void }) {
    const year = normalizedMonth.getFullYear();
    const month = normalizedMonth.getMonth() + 1;
    this.selectedReportMonth = `${year}-${String(month).padStart(2, '0')}`;
    this.selectedReportMonthDate = new Date(year, month - 1, 1);
    datepicker.close();
  }

  onReportWeekPicked(date: Date | null): void {
    if (!date) return;
    const iso = this.getISOWeekYearAndNumber(date);
    this.selectedReportWeek = `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
    this.selectedReportWeekDate = date;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  getReportMonthDateRange(): string {
    if (!this.selectedReportMonth) return '';
    const [year, month] = this.selectedReportMonth.split('-').map(Number);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = monthStart.toLocaleDateString('en-US', options);
    const endStr = monthEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }

  getReportWeekDateRange(): string {
    if (!this.selectedReportWeek) return '';
    const [yearWeekStr, weekStr] = this.selectedReportWeek.split('-W');
    const year = parseInt(yearWeekStr, 10);
    const week = parseInt(weekStr, 10);

    const weekStart = this.getWeekStartDate(year, week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  }
}
