import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { Chart, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';

// Register Chart.js components
Chart.register(...registerables);

interface BusinessStats {
  totalCustomers: number;
  totalBookings: number;
  totalEmployees: number;
  customerSatisfaction: number;
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  businessStats: BusinessStats = {
    totalCustomers: 0,
    totalBookings: 0,
    totalEmployees: 8,
    customerSatisfaction: 4.7,
  };

  recentBookings: RecentBooking[] = [
    {
      id: 1,
      customerName: 'John Doe',
      service: 'Premium Wash',
      status: 'Completed',
      amount: 250,
      date: '2024-03-20',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      service: 'Full Service',
      status: 'In Progress',
      amount: 350,
      date: '2024-03-20',
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      service: 'Interior Clean',
      status: 'Pending',
      amount: 150,
      date: '2024-03-20',
    },
    {
      id: 4,
      customerName: 'Sarah Wilson',
      service: 'Basic Wash',
      status: 'Completed',
      amount: 100,
      date: '2024-03-20',
    },
    {
      id: 5,
      customerName: 'Robert Brown',
      service: 'Premium Wash',
      status: 'Pending',
      amount: 250,
      date: '2024-03-20',
    },
  ];

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
  private apiUrl = 'http://localhost/autowash-hub-api/api';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCustomerCount();
    this.loadEmployeeCount();
    this.loadBookingCount();

    // Only initialize charts if in browser environment
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  private loadCustomerCount(): void {
    this.http.get(`${this.apiUrl}/get_customer_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.businessStats.totalCustomers = response.payload.total_customers;
        } else {
          console.error('Failed to fetch customer count:', response);
          // Set a default value if fetch fails
          this.businessStats.totalCustomers = 0;
        }
      },
      error: (error) => {
        console.error('Error fetching customer count:', error);
        // Set a default value if fetch fails
        this.businessStats.totalCustomers = 0;
      },
    });
  }

  private loadEmployeeCount(): void {
    this.http.get(`${this.apiUrl}/get_employee_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.businessStats.totalEmployees = response.payload.total_employees;
        } else {
          console.error('Failed to fetch employee count:', response);
          // Keep the default value if fetch fails
        }
      },
      error: (error) => {
        console.error('Error fetching employee count:', error);
        // Keep the default value if fetch fails
      },
    });
  }

  private loadBookingCount(): void {
    this.http.get(`${this.apiUrl}/get_booking_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.businessStats.totalBookings = response.payload.total_bookings;
        } else {
          this.businessStats.totalBookings = 0;
        }
      },
      error: () => {
        this.businessStats.totalBookings = 0;
      },
    });
  }

  private initializeCharts(): void {
    // Only proceed if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Revenue Chart
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
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Monthly Revenue',
              data: [18000, 21000, 23000, 25000, 24000, 25000],
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              fill: true,
              tension: 0.4,
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

    // Services Distribution Chart
    const servicesCtx = document.getElementById(
      'servicesChart'
    ) as HTMLCanvasElement;
    if (servicesCtx) {
      if (this.servicesChart) {
        this.servicesChart.destroy();
      }
      this.servicesChart = new Chart(servicesCtx, {
        type: 'doughnut',
        data: {
          labels: [
            'Premium Wash',
            'Full Service',
            'Basic Wash',
            'Interior Clean',
          ],
          datasets: [
            {
              data: [35, 25, 20, 20],
              backgroundColor: [
                'rgba(25, 118, 210, 0.8)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(255, 152, 0, 0.8)',
                'rgba(244, 67, 54, 0.8)',
              ],
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
                font: {
                  size: 12,
                },
              },
            },
            title: {
              display: true,
              text: 'Services Distribution',
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

  updateBookingStatus(bookingId: number, newStatus: string): void {
    const booking = this.recentBookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = newStatus;
      // TODO: Update backend
    }
  }

  viewBookingDetails(bookingId: number): void {
    // TODO: Implement booking details view
    console.log('View booking details:', bookingId);
  }
}
