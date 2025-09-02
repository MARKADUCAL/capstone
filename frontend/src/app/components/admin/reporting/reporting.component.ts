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
} from '../../../services/reporting.service';

// Register Chart.js components
Chart.register(...registerables);

interface RevenueData {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

interface ServiceStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
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
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };

  serviceStats: ServiceStats = {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
  };

  private revenueChart: Chart | undefined;
  private serviceChart: Chart | undefined;
  private bookingsChart: Chart | undefined;

  // Data from API for charts
  private revenueLabels: string[] = [];
  private revenueValues: number[] = [];
  private serviceLabels: string[] = [];
  private serviceCounts: number[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private reportingService: ReportingService
  ) {}

  ngOnInit(): void {
    // Fetch live data
    this.loadDashboardSummary();
    this.loadRevenueAnalytics();
    this.loadServiceDistribution();
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
      setTimeout(() => {
        // Reinitialize the chart in the selected tab
        switch (event.index) {
          case 0:
            this.initializeRevenueChart();
            break;
          case 1:
            this.initializeServiceChart();
            break;
          case 2:
            this.initializeBookingsChart();
            break;
        }
      }, 100);
    }
  }

  private initializeCharts(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeRevenueChart();
      this.initializeServiceChart();
      this.initializeBookingsChart();
    }
  }

  private loadDashboardSummary(): void {
    this.reportingService.getDashboardSummary().subscribe((summary) => {
      if (!summary) return;
      this.serviceStats.totalBookings = Number(summary.total_bookings) || 0;
      this.serviceStats.completedBookings =
        Number(summary.completed_bookings) || 0;
      this.serviceStats.pendingBookings = Number(summary.pending_bookings) || 0;
      // Cancellation not provided directly; keep as 0 for now
      this.revenueData.monthly = Number(summary.monthly_revenue) || 0;
    });
  }

  private loadRevenueAnalytics(): void {
    this.reportingService.getRevenueAnalytics().subscribe((points) => {
      this.revenueLabels = points.map((p) => p.month);
      this.revenueValues = points.map((p) => Number(p.revenue) || 0);
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.initializeRevenueChart(), 0);
      }
    });
  }

  private loadServiceDistribution(): void {
    this.reportingService.getServiceDistribution().subscribe((items) => {
      this.serviceLabels = items.map((i) => i.service_name);
      this.serviceCounts = items.map((i) => Number(i.booking_count) || 0);
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.initializeServiceChart(), 0);
      }
    });
  }

  private initializeRevenueChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Revenue Trend Chart
    const revenueCtx = document.getElementById(
      'revenueChart'
    ) as HTMLCanvasElement;
    if (revenueCtx) {
      if (this.revenueChart) {
        this.revenueChart.destroy();
      }
      this.revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: this.revenueLabels.length
            ? this.revenueLabels
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Monthly Revenue',
              data: this.revenueValues.length
                ? this.revenueValues
                : [65000, 59000, 80000, 81000, 56000, 75000],
              fill: true,
              tension: 0.4,
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              pointBackgroundColor: '#1976d2',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
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
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value,
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
  }

  private initializeServiceChart(): void {
    // Service Distribution Chart
    const serviceCtx = document.getElementById(
      'serviceChart'
    ) as HTMLCanvasElement;
    if (serviceCtx) {
      if (this.serviceChart) {
        this.serviceChart.destroy();
      }
      this.serviceChart = new Chart(serviceCtx, {
        type: 'pie',
        data: {
          labels: this.serviceLabels.length
            ? this.serviceLabels
            : ['Basic Wash', 'Premium Wash', 'Full Service', 'Interior Clean'],
          datasets: [
            {
              data: this.serviceCounts.length
                ? this.serviceCounts
                : [30, 25, 25, 20],
              backgroundColor: [
                'rgba(25, 118, 210, 0.8)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(255, 160, 0, 0.8)',
                'rgba(244, 67, 54, 0.8)',
              ],
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
          },
        },
      });
    }
  }

  private initializeBookingsChart(): void {
    // Bookings Chart
    const bookingsCtx = document.getElementById(
      'bookingsChart'
    ) as HTMLCanvasElement;
    if (bookingsCtx) {
      if (this.bookingsChart) {
        this.bookingsChart.destroy();
      }
      this.bookingsChart = new Chart(bookingsCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Daily Bookings',
              data: [25, 30, 28, 32, 35, 40, 38],
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
          },
          scales: {
            y: {
              beginAtZero: true,
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
    return (
      (this.serviceStats.completedBookings / this.serviceStats.totalBookings) *
      100
    );
  }

  getCancellationRate(): number {
    return (
      (this.serviceStats.cancelledBookings / this.serviceStats.totalBookings) *
      100
    );
  }
}
