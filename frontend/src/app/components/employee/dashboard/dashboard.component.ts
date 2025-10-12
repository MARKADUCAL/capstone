import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TaskDetailsDialog } from './task-details-dialog.component';
import { BookingService } from '../../../services/booking.service';

interface Task {
  id: number;
  customerName: string;
  service: string;
  status: string;
  time: string;
  date?: string;
  vehicleType?: string;
  price?: number;
  notes?: string;
}

interface DailyStats {
  totalBookings: number;
  completedTasks: number;
  pendingTasks: number;
  customerRating: number;
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
  dailyStats: DailyStats = {
    totalBookings: 0,
    completedTasks: 0,
    pendingTasks: 0,
    customerRating: 4.5,
  };

  upcomingTasks: Task[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'customerName',
    'service',
    'time',
    'status',
    'actions',
  ];

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private bookingService: BookingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadBookingStats();
    this.loadUpcomingTasks();
  }

  private loadBookingStats(): void {
    // Total Bookings
    this.http.get(`${this.apiUrl}/get_booking_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.dailyStats.totalBookings = response.payload.total_bookings;
        } else {
          this.dailyStats.totalBookings = 0;
        }
      },
      error: () => {
        this.dailyStats.totalBookings = 0;
      },
    });
    // Completed Bookings
    this.http.get(`${this.apiUrl}/get_completed_booking_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.dailyStats.completedTasks = response.payload.completed_bookings;
        } else {
          this.dailyStats.completedTasks = 0;
        }
      },
      error: () => {
        this.dailyStats.completedTasks = 0;
      },
    });
    // Pending Bookings
    this.http.get(`${this.apiUrl}/get_pending_booking_count`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.dailyStats.pendingTasks = response.payload.pending_bookings;
        } else {
          this.dailyStats.pendingTasks = 0;
        }
      },
      error: () => {
        this.dailyStats.pendingTasks = 0;
      },
    });
  }

  loadUpcomingTasks(): void {
    this.loading = true;
    this.error = null;

    // Get current employee ID from localStorage
    const employeeData = localStorage.getItem('employee_data');
    if (!employeeData) {
      this.error = 'Employee not logged in';
      this.loading = false;
      return;
    }

    try {
      const employee = JSON.parse(employeeData);
      const employeeId = employee.id;

      // Load bookings assigned to this employee
      this.bookingService.getBookingsByEmployee(employeeId).subscribe({
        next: (bookings) => {
          this.upcomingTasks = bookings.map((b: any, idx: number) => {
            // Normalize status
            const normalizedStatus = this.normalizeStatus(
              b.status ?? 'Pending'
            );

            // Format time for display
            const time = b.washTime ? this.formatTime(b.washTime) : 'TBD';

            // Resolve customer name
            const customerName = this.resolveCustomerName(
              b.customerName,
              b.nickname
            );

            return {
              id: Number(b.id ?? idx + 1),
              customerName: customerName,
              service: b.serviceName ?? 'Standard Wash',
              status: normalizedStatus,
              time: time,
              date: b.washDate ?? '',
              vehicleType: b.vehicleType ?? b.vehicle_type ?? 'Unknown',
              price: b.price ? Number(b.price) : undefined,
              notes: b.notes ?? '',
            };
          });

          // Filter to show only upcoming/pending tasks (not completed)
          this.upcomingTasks = this.upcomingTasks.filter(
            (task) =>
              task.status.toLowerCase() !== 'completed' &&
              task.status.toLowerCase() !== 'cancelled'
          );

          // Sort by time (earliest first)
          this.upcomingTasks.sort((a, b) => {
            if (a.time === 'TBD') return 1;
            if (b.time === 'TBD') return -1;
            return a.time.localeCompare(b.time);
          });

          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load upcoming tasks';
          this.loading = false;
          console.error('Error loading upcoming tasks:', err);
        },
      });
    } catch (error) {
      this.error = 'Failed to parse employee data';
      this.loading = false;
      console.error('Error parsing employee data:', error);
    }
  }

  private normalizeStatus(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'Completed';
    if (statusLower === 'cancelled') return 'Cancelled';
    if (statusLower === 'confirmed' || statusLower === 'approved')
      return 'Confirmed';
    if (statusLower === 'in progress' || statusLower === 'in_progress')
      return 'In Progress';
    return 'Pending';
  }

  private formatTime(timeString: string): string {
    // Handle different time formats from database
    if (!timeString) return 'TBD';

    // If it's already in HH:MM format, return as is
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      return timeString;
    }

    // If it's in HH:MM:SS format, remove seconds
    if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5);
    }

    // Try to parse as Date and format
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (e) {
      console.warn('Could not parse time:', timeString);
    }

    return timeString;
  }

  private resolveCustomerName(dbFullName?: string, nickname?: string): string {
    if (dbFullName && dbFullName.trim()) {
      return dbFullName.trim();
    }
    if (nickname && nickname.trim()) {
      return nickname.trim();
    }
    return 'Unknown Customer';
  }

  updateTaskStatus(taskId: number, newStatus: string): void {
    const task = this.upcomingTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = newStatus;
      // TODO: Update backend
    }
  }

  viewTaskDetails(taskId: number): void {
    const task = this.upcomingTasks.find((t) => t.id === taskId);
    if (task) {
      const dialogRef = this.dialog.open(TaskDetailsDialog, {
        width: '600px',
        data: task,
        disableClose: false,
        autoFocus: false,
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('Task details dialog closed');
      });
    }
  }
}
