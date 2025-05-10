import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';
import { Booking, BookingStatus } from '../../../models/booking.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Expose BookingStatus enum to template
  BookingStatus = BookingStatus;

  displayedColumns: string[] = [
    'date',
    'time',
    'customer',
    'vehicle',
    'service',
    'status',
    'payment',
    'actions',
  ];

  dataSource!: MatTableDataSource<Booking>;
  appointments: Booking[] = [];
  filteredAppointments: Booking[] = [];
  searchTerm: string = '';
  statusFilter: BookingStatus | 'all' = 'all';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private bookingService: BookingService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Booking>();
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = null;

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.appointments = bookings;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = 'Failed to load appointments. Please try again.';
        this.isLoading = false;
        this.snackBar.open('Error loading appointments', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(
        (appointment) => appointment.status === this.statusFilter
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.nickname.toLowerCase().includes(searchLower) ||
          appointment.vehicleType.toLowerCase().includes(searchLower) ||
          appointment.services.toLowerCase().includes(searchLower)
      );
    }

    this.filteredAppointments = filtered;
    this.dataSource.data = filtered;
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFilters();
  }

  onStatusFilterChange(status: BookingStatus | 'all'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  updateStatus(appointment: Booking, newStatus: BookingStatus): void {
    this.isLoading = true;
    this.bookingService
      .updateBookingStatus(appointment.id, newStatus)
      .subscribe({
        next: () => {
          this.loadAppointments();
          this.snackBar.open(
            'Appointment status updated successfully',
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Failed to update appointment status', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return 'accent';
      case BookingStatus.CONFIRMED:
        return 'primary';
      case BookingStatus.COMPLETED:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'warn';
      default:
        return 'default';
    }
  }

  refreshAppointments(): void {
    this.loadAppointments();
  }
}
