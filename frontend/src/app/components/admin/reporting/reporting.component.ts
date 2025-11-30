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

  // Month selector
  selectedMonth: string = '';
  private currentMonthStart: Date = new Date();

  isGeneratingPDF: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private reportingService: ReportingService
  ) {}

  ngOnInit(): void {
    // Initialize month selector to current month
    this.initializeMonthSelector();

    // Fetch live data
    this.loadDashboardSummary();
    this.loadRevenueAnalytics();
    this.loadServiceDistribution();
    this.loadMonthlyBookings();
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
    monthEnd: Date
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
    this.weeklyBookingLabels = [];
    this.weeklyBookingValues = [];

    for (let i = 1; i <= daysInMonth; i++) {
      this.weeklyBookingLabels.push(i.toString());
      this.weeklyBookingValues.push(bookingMap.get(i) || 0);
    }

    console.log('Processed monthly bookings:', {
      labels: this.weeklyBookingLabels,
      values: this.weeklyBookingValues,
    });

    if (isPlatformBrowser(this.platformId)) {
      if (this.bookingsChart) {
        this.updateBookingsChart();
      } else {
        setTimeout(() => this.initializeBookingsChart(), 100);
      }
    }
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
    this.currentMonthStart = new Date(year, month - 1, 1);

    console.log('Month changed to:', this.selectedMonth, 'Starting:', this.currentMonthStart);

    // Reload the monthly bookings data for the selected month
    this.loadMonthlyBookings();
  }

  getWeekDateRange(): string {
    // This method is kept for backwards compatibility but is not used
    return '';
  }

  onWeekChange(): void {
    // This method is kept for backwards compatibility but is not used
  }
}
