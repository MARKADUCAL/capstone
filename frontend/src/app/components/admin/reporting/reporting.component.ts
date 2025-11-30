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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
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

  // Week selector
  selectedWeek: string = '';
  private currentWeekStart: Date = new Date();

  isGeneratingPDF: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private reportingService: ReportingService
  ) {}

  ngOnInit(): void {
    // Initialize week selector to current week
    this.initializeWeekSelector();

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

  // PDF Generation Methods
  async generatePDF(
    reportType: 'daily' | 'weekly' | 'monthly' | 'quantity'
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.error('PDF generation is only available in browser');
      return;
    }

    if (this.isGeneratingPDF) {
      return; // Prevent multiple simultaneous PDF generations
    }

    this.isGeneratingPDF = true;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Leydi Boss - Reports & Analytics', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 10;

      // Add report type and date
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      const reportTypeLabel = this.getReportTypeLabel(reportType);
      pdf.text(`${reportTypeLabel} Report`, pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 5;
      pdf.setFontSize(10);
      pdf.text(
        `Generated on: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 15;

      // Add summary statistics
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Summary Statistics', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      // Revenue section
      pdf.setFontSize(12);
      pdf.setTextColor(25, 118, 210);
      pdf.text('Revenue', margin, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Weekly Revenue: ₱${this.revenueData.weekly.toLocaleString()}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Monthly Revenue: ₱${this.revenueData.monthly.toLocaleString()}`,
        margin + 5,
        yPosition
      );
      yPosition += 8;

      // Booking statistics section
      pdf.setFontSize(12);
      pdf.setTextColor(25, 118, 210);
      pdf.text('Booking Statistics', margin, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Total Bookings: ${this.serviceStats.totalBookings}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Completed: ${this.serviceStats.completedBookings}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Pending: ${this.serviceStats.pendingBookings}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Cancelled: ${this.serviceStats.cancelledBookings}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Declined: ${this.serviceStats.declinedBookings}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Completion Rate: ${this.getCompletionRate().toFixed(1)}%`,
        margin + 5,
        yPosition
      );
      yPosition += 10;

      // Add report-specific data
      if (reportType === 'quantity') {
        yPosition = this.addQuantityReportData(
          pdf,
          yPosition,
          pageWidth,
          margin,
          pageHeight
        );
      } else if (reportType === 'daily') {
        yPosition = this.addDailyReportData(
          pdf,
          yPosition,
          pageWidth,
          margin,
          pageHeight
        );
      } else if (reportType === 'weekly') {
        yPosition = this.addWeeklyReportData(
          pdf,
          yPosition,
          pageWidth,
          margin,
          pageHeight
        );
      } else if (reportType === 'monthly') {
        yPosition = this.addMonthlyReportData(
          pdf,
          yPosition,
          pageWidth,
          margin,
          pageHeight
        );
      }

      // Capture and add charts
      yPosition = await this.addChartsToPDF(
        pdf,
        yPosition,
        pageWidth,
        margin,
        pageHeight
      );

      // Save PDF
      const fileName = `LeydiBoss_${reportTypeLabel}_Report_${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  private getReportTypeLabel(
    type: 'daily' | 'weekly' | 'monthly' | 'quantity'
  ): string {
    const labels: { [key: string]: string } = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quantity: 'Quantity',
    };
    return labels[type] || 'Report';
  }

  private addQuantityReportData(
    pdf: jsPDF,
    yPosition: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Service Distribution by Quantity', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Add service distribution table
    const tableStartY = yPosition;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);

    // Table header
    pdf.setFillColor(25, 118, 210);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('Service Type', margin + 2, yPosition);
    pdf.text('Quantity', pageWidth - margin - 30, yPosition, {
      align: 'right',
    });
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);

    // Table rows
    for (let i = 0; i < this.serviceLabels.length; i++) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, 'S');
      pdf.text(this.serviceLabels[i], margin + 2, yPosition);
      pdf.text(
        this.serviceCounts[i].toString(),
        pageWidth - margin - 30,
        yPosition,
        { align: 'right' }
      );
      yPosition += 6;
    }

    return yPosition + 5;
  }

  private addDailyReportData(
    pdf: jsPDF,
    yPosition: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Daily Booking Distribution', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Add daily bookings table
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);

    // Table header
    pdf.setFillColor(25, 118, 210);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Day', margin + 2, yPosition);
    pdf.text('Bookings', pageWidth - margin - 30, yPosition, {
      align: 'right',
    });
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);

    // Table rows
    for (let i = 0; i < days.length; i++) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      const dayShort = days[i].substring(0, 3);
      const index = this.weeklyBookingLabels.indexOf(dayShort);
      const count = index >= 0 ? this.weeklyBookingValues[index] : 0;
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, 'S');
      pdf.text(days[i], margin + 2, yPosition);
      pdf.text(count.toString(), pageWidth - margin - 30, yPosition, {
        align: 'right',
      });
      yPosition += 6;
    }

    return yPosition + 5;
  }

  private addWeeklyReportData(
    pdf: jsPDF,
    yPosition: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Weekly Summary', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `This week's revenue: ₱${this.revenueData.weekly.toLocaleString()}`,
      margin,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Total bookings this week: ${this.weeklyBookingValues.reduce(
        (a, b) => a + b,
        0
      )}`,
      margin,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Average daily bookings: ${(
        this.weeklyBookingValues.reduce((a, b) => a + b, 0) / 7
      ).toFixed(1)}`,
      margin,
      yPosition
    );

    return yPosition + 10;
  }

  private addMonthlyReportData(
    pdf: jsPDF,
    yPosition: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Monthly Revenue Trend', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Add monthly revenue table
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);

    // Table header
    pdf.setFillColor(25, 118, 210);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Month', margin + 2, yPosition);
    pdf.text('Revenue', pageWidth - margin - 30, yPosition, { align: 'right' });
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);

    // Table rows
    for (let i = 0; i < this.revenueLabels.length; i++) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6, 'S');
      pdf.text(this.revenueLabels[i], margin + 2, yPosition);
      pdf.text(
        `₱${this.revenueValues[i].toLocaleString()}`,
        pageWidth - margin - 30,
        yPosition,
        { align: 'right' }
      );
      yPosition += 6;
    }

    return yPosition + 5;
  }

  private async addChartsToPDF(
    pdf: jsPDF,
    yPosition: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): Promise<number> {
    if (!isPlatformBrowser(this.platformId)) return yPosition;

    try {
      // Capture Revenue Chart
      if (this.revenueChart) {
        const revenueCanvas = document.getElementById(
          'revenueChart'
        ) as HTMLCanvasElement;
        if (revenueCanvas) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }
          const imgData = await html2canvas(revenueCanvas, {
            backgroundColor: '#ffffff',
          }).then((canvas) => canvas.toDataURL('image/png'));
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight =
            (revenueCanvas.height * imgWidth) / revenueCanvas.width;
          pdf.setFontSize(12);
          pdf.setTextColor(44, 62, 80);
          pdf.text('Revenue Trend Chart', margin, yPosition);
          yPosition += 5;
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            Math.min(imgHeight, 60)
          );
          yPosition += Math.min(imgHeight, 60) + 10;
        }
      }

      // Capture Service Distribution Chart
      if (this.serviceChart) {
        const serviceCanvas = document.getElementById(
          'serviceChart'
        ) as HTMLCanvasElement;
        if (serviceCanvas) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }
          const imgData = await html2canvas(serviceCanvas, {
            backgroundColor: '#ffffff',
          }).then((canvas) => canvas.toDataURL('image/png'));
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight =
            (serviceCanvas.height * imgWidth) / serviceCanvas.width;
          pdf.setFontSize(12);
          pdf.setTextColor(44, 62, 80);
          pdf.text('Service Distribution Chart', margin, yPosition);
          yPosition += 5;
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            Math.min(imgHeight, 60)
          );
          yPosition += Math.min(imgHeight, 60) + 10;
        }
      }

      // Capture Weekly Bookings Chart
      if (this.bookingsChart) {
        const bookingsCanvas = document.getElementById(
          'bookingsChart'
        ) as HTMLCanvasElement;
        if (bookingsCanvas) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }
          const imgData = await html2canvas(bookingsCanvas, {
            backgroundColor: '#ffffff',
          }).then((canvas) => canvas.toDataURL('image/png'));
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight =
            (bookingsCanvas.height * imgWidth) / bookingsCanvas.width;
          pdf.setFontSize(12);
          pdf.setTextColor(44, 62, 80);
          pdf.text('Weekly Booking Distribution Chart', margin, yPosition);
          yPosition += 5;
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            Math.min(imgHeight, 60)
          );
          yPosition += Math.min(imgHeight, 60) + 10;
        }
      }
    } catch (error) {
      console.error('Error capturing charts:', error);
    }

    return yPosition;
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  getWeekDateRange(): string {
    if (!this.selectedWeek) return '';
    const [year, week] = this.selectedWeek.split('-W').map(Number);

    // Create a date for Jan 4th of the year (always in week 1)
    const jan4 = new Date(year, 0, 4);

    // Get Monday of week 1
    const weekStart = new Date(jan4);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Calculate the start of the selected week
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    // Calculate end date (Sunday)
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

    // Create a date for Jan 4th of the year (always in week 1)
    const jan4 = new Date(year, 0, 4);

    // Get Monday of week 1
    const weekStart = new Date(jan4);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Calculate the start of the selected week
    this.currentWeekStart = new Date(weekStart);
    this.currentWeekStart.setDate(
      this.currentWeekStart.getDate() + (week - 1) * 7
    );

    console.log(
      'Week changed to:',
      this.selectedWeek,
      'Starting:',
      this.currentWeekStart
    );

    // Reload the weekly bookings data for the selected week
    this.loadWeeklyBookingsForWeek(this.currentWeekStart);
  }

  private loadWeeklyBookingsForWeek(weekStart: Date): void {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    console.log('Loading bookings for week:', {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    });

    // Try the date range endpoint first
    this.reportingService
      .getWeeklyBookingsByDateRange(weekStart, weekEnd)
      .subscribe({
        next: (points) => {
          console.log(
            'Weekly bookings data for selected week:',
            points
          );
          if (points && points.length > 0) {
            this.processWeeklyBookings(points);
          } else {
            console.warn(
              'No bookings data received from date range endpoint'
            );
            // Try fallback: get all bookings and filter on client side
            this.loadAllBookingsAndFilter(weekStart, weekEnd);
          }
        },
        error: (err) => {
          console.error(
            'Error loading weekly bookings for selected week:',
            err
          );
          console.log('Trying fallback approach...');
          // On error, try to get all bookings and filter on client side
          this.loadAllBookingsAndFilter(weekStart, weekEnd);
        },
      });
  }

  private loadAllBookingsAndFilter(
    weekStart: Date,
    weekEnd: Date
  ): void {
    // Fallback: Use the current week bookings and assume it's cached
    // In a real scenario, you would fetch all bookings or implement the date range endpoint
    console.log(
      'Using fallback: displaying current cached weekly bookings'
    );

    // For now, we'll show empty since we don't have a way to fetch all bookings
    this.weeklyBookingValues = [0, 0, 0, 0, 0, 0, 0];

    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart) {
        this.updateBookingsChart();
      }
    }
  }

  private processWeeklyBookings(points: WeeklyBookingPoint[]): void {
    console.log('Starting to process weekly bookings with points:', points);
    
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

    const normalizeDay = (day: string): string => {
      const normalized = day.trim();
      if (dayMap[normalized]) {
        return dayMap[normalized];
      }
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
      console.log('Processing booking point:', {
        day: p.day,
        normalized: normalizedDay,
        count,
      });
      const fullDay = orderedDays.find(
        (d) =>
          dayMap[d] === normalizedDay ||
          d.toLowerCase().startsWith(normalizedDay.toLowerCase())
      );
      if (fullDay) {
        bookingMap.set(fullDay, count);
      } else {
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
      if (this.bookingsChart) {
        console.log('Chart exists, updating it');
        this.updateBookingsChart();
      } else {
        console.log('Chart does not exist, initializing it');
        setTimeout(() => this.initializeBookingsChart(), 100);
      }
    }
  }
}
