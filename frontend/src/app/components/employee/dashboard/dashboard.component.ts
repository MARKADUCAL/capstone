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

interface Task {
  id: number;
  customerName: string;
  service: string;
  status: string;
  time: string;
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

  upcomingTasks: Task[] = [
    {
      id: 1,
      customerName: 'John Doe',
      service: 'Basic Wash',
      status: 'Pending',
      time: '10:00 AM',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      service: 'Full Service',
      status: 'In Progress',
      time: '10:30 AM',
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      service: 'Interior Clean',
      status: 'Pending',
      time: '11:00 AM',
    },
    {
      id: 4,
      customerName: 'Sarah Wilson',
      service: 'Premium Wash',
      status: 'Pending',
      time: '11:30 AM',
    },
  ];

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadBookingStats();
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
