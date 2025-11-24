import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TaskDetailsDialog } from './task-details-dialog.component';
import { BookingService } from '../../../services/booking.service';
import { FeedbackService } from '../../../services/feedback.service';

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
  rawDate?: string;
  rawTime?: string;
  sortValue?: number;
  customerRating?: number;
  customerRatingComment?: string;
  feedbackCreatedAt?: string;
}

interface DailyStats {
  totalBookings: number;
  completedTasks: number;
  pendingTasks: number;
  customerRating: number;
}

interface CalendarEvent {
  label: string;
  type: 'quotes' | 'giveaway' | 'reel';
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
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  dailyStats: DailyStats = {
    totalBookings: 0,
    completedTasks: 0,
    pendingTasks: 0,
    customerRating: 0,
  };

  upcomingTasks: Task[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'customerName',
    'service',
    'schedule',
    'actions',
  ];

  // Calendar properties
  currentDate = new Date();
  today = new Date();
  weekDays = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'];
  calendarDays: CalendarDay[] = [];

  get currentMonthYear(): string {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${
      monthNames[this.currentDate.getMonth()]
    }, ${this.currentDate.getFullYear()}`;
  }

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private bookingService: BookingService,
    private feedbackService: FeedbackService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadBookingStats();
    this.loadUpcomingTasks();
    this.loadCustomerRating();
    this.generateCalendar();
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

  private loadCustomerRating(limit: number = 200): void {
    this.feedbackService.getAllFeedback(limit).subscribe({
      next: (feedbackList) => {
        if (!Array.isArray(feedbackList) || feedbackList.length === 0) {
          this.dailyStats.customerRating = 0;
          return;
        }

        const ratings = feedbackList
          .map((feedback: any) => Number(feedback?.rating))
          .filter((rating) => !isNaN(rating) && rating > 0);

        if (ratings.length === 0) {
          this.dailyStats.customerRating = 0;
          return;
        }

        const average =
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        this.dailyStats.customerRating = Number(average.toFixed(1));
      },
      error: (error) => {
        console.error('Error loading customer rating:', error);
        this.dailyStats.customerRating = 0;
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
            const rawTime: string = b.washTime ?? '';
            const time = rawTime ? this.formatTime(rawTime) : 'Time TBD';

            // Format date for display
            const rawDate: string = b.washDate ?? '';
            const date = rawDate ? this.formatDate(rawDate) : 'Date TBD';

            const sortValue = this.computeScheduleSortValue(rawDate, rawTime);

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
              date: date,
              vehicleType: b.vehicleType ?? b.vehicle_type ?? 'Unknown',
              price: b.price ? Number(b.price) : undefined,
              notes: b.notes ?? '',
              rawDate: rawDate,
              rawTime: rawTime,
              sortValue: sortValue,
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
            const aValue =
              a.sortValue !== undefined ? a.sortValue : Number.MAX_SAFE_INTEGER;
            const bValue =
              b.sortValue !== undefined ? b.sortValue : Number.MAX_SAFE_INTEGER;
            return aValue - bValue;
          });

          // Regenerate calendar with updated tasks
          this.generateCalendar();

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
    if (!timeString) {
      return 'Time TBD';
    }

    const trimmed = timeString.trim();
    if (!trimmed) {
      return 'Time TBD';
    }

    if (/^tbd$/i.test(trimmed)) {
      return 'Time TBD';
    }

    const amPmMatch = trimmed.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i
    );
    if (amPmMatch) {
      const hours = parseInt(amPmMatch[1], 10) % 12 || 12;
      const minutes = amPmMatch[2];
      const period = amPmMatch[3].toUpperCase();
      return `${hours}:${minutes} ${period}`;
    }

    const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (hhmmMatch) {
      const hours24 = parseInt(hhmmMatch[1], 10);
      const minutes = hhmmMatch[2];
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      return `${hours12}:${minutes} ${period}`;
    }

    const parsedDate = new Date(`1970-01-01T${trimmed}`);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return trimmed;
  }

  private formatDate(dateString: string): string {
    if (!dateString) {
      return 'Date TBD';
    }

    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private computeScheduleSortValue(
    dateString?: string,
    timeString?: string
  ): number {
    const [hours, minutes] = this.extractTimeParts(timeString);

    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime()) && hours !== null && minutes !== null) {
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      }
    }

    if (hours !== null && minutes !== null) {
      return hours * 60 + minutes;
    }

    return Number.MAX_SAFE_INTEGER;
  }

  private extractTimeParts(
    timeString?: string
  ): [number | null, number | null] {
    if (!timeString) {
      return [null, null];
    }

    const trimmed = timeString.trim();
    if (!trimmed) {
      return [null, null];
    }

    const amPmMatch = trimmed.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i
    );
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10) % 12;
      if (amPmMatch[3].toUpperCase() === 'PM') {
        hours += 12;
      }
      const minutes = parseInt(amPmMatch[2], 10);
      return [hours, minutes];
    }

    const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hhmmMatch) {
      const hours = parseInt(hhmmMatch[1], 10);
      const minutes = parseInt(hhmmMatch[2], 10);
      return [hours, minutes];
    }

    const parsedDate = new Date(`1970-01-01T${trimmed}`);
    if (!isNaN(parsedDate.getTime())) {
      return [parsedDate.getHours(), parsedDate.getMinutes()];
    }

    return [null, null];
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
      // Load feedback data for completed bookings
      const taskWithFeedback = { ...task };

      if (task.status === 'Completed') {
        this.feedbackService.getFeedbackByBookingId(task.id).subscribe({
          next: (feedbackList) => {
            if (feedbackList && feedbackList.length > 0) {
              const feedback = feedbackList[0];
              taskWithFeedback.customerRating = feedback.rating;
              taskWithFeedback.customerRatingComment = feedback.comment;
              taskWithFeedback.feedbackCreatedAt = feedback.created_at;
            }
            this.openTaskDetailsDialog(taskWithFeedback);
          },
          error: (err) => {
            console.error('Error loading feedback:', err);
            this.openTaskDetailsDialog(taskWithFeedback);
          },
        });
      } else {
        this.openTaskDetailsDialog(taskWithFeedback);
      }
    }
  }

  private openTaskDetailsDialog(task: Task): void {
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

  // Calendar methods
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = this.today;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday, we want Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6; // Sunday becomes 6

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

    // Map tasks to calendar events
    if (this.upcomingTasks && this.upcomingTasks.length > 0) {
      this.upcomingTasks.forEach((task) => {
        try {
          if (!task.rawDate) return;
          const taskDate = new Date(task.rawDate);
          if (
            taskDate.getFullYear() === year &&
            taskDate.getMonth() === month &&
            taskDate.getDate() === day
          ) {
            // Determine event type based on task status
            let eventType: 'quotes' | 'giveaway' | 'reel' = 'quotes';

            if (task.status?.toLowerCase().includes('completed')) {
              eventType = 'reel';
            } else if (
              task.status?.toLowerCase().includes('confirmed') ||
              task.status?.toLowerCase().includes('approved')
            ) {
              eventType = 'giveaway';
            }

            events.push({
              label: task.service || 'Task',
              type: eventType,
            });
          }
        } catch (error) {
          console.warn('Error parsing task date:', task.rawDate, error);
        }
      });
    }

    return events;
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.today = new Date();
    this.generateCalendar();
  }

  openDateTasksModal(day: CalendarDay): void {
    const selectedDate = new Date(day.year, day.month, day.date);
    const tasksForDate = this.getTasksForDate(selectedDate);

    // For now, just show a simple alert. You can create a dialog component later if needed
    if (tasksForDate.length > 0) {
      const taskList = tasksForDate
        .map((t) => `${t.customerName} - ${t.service}`)
        .join('\n');
      alert(`Tasks for ${this.formatDateForModal(selectedDate)}:\n\n${taskList}`);
    } else {
      alert(`No tasks scheduled for ${this.formatDateForModal(selectedDate)}`);
    }
  }

  getTasksForDate(date: Date): Task[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return this.upcomingTasks.filter((task) => {
      try {
        if (!task.rawDate) return false;
        const taskDate = new Date(task.rawDate);
        if (isNaN(taskDate.getTime())) return false;

        return (
          taskDate.getFullYear() === year &&
          taskDate.getMonth() === month &&
          taskDate.getDate() === day
        );
      } catch (error) {
        console.warn('Error parsing task date:', task, error);
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
