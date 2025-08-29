import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

interface CarWashBooking {
  id: number;
  customerName: string;
  vehicleType: string;
  date: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  serviceType?: string;
  price?: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-car-wash-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatDialogModule,
  ],
  templateUrl: './car-wash-booking.component.html',
  styleUrl: './car-wash-booking.component.css',
})
export class CarWashBookingComponent implements OnInit {
  bookings: CarWashBooking[] = [];
  selectedStatus: string = 'All';
  loading: boolean = false;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  constructor(
    private snackBar: MatSnackBar,
    private bookingService: BookingService,
    private dialog: MatDialog,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  refreshBookings(): void {
    this.loadBookings();
  }

  approveBooking(booking: CarWashBooking): void {
    const prev = booking.status;
    booking.status = 'Approved';
    this.bookingService.updateBookingStatus(booking.id, 'Approved').subscribe({
      next: () => this.showNotification('Booking approved successfully'),
      error: (err) => {
        booking.status = prev;
        this.showNotification(err.message || 'Failed to approve booking');
      },
    });
  }

  rejectBooking(booking: CarWashBooking): void {
    const prev = booking.status;
    booking.status = 'Rejected';
    this.bookingService.updateBookingStatus(booking.id, 'Rejected').subscribe({
      next: () => this.showNotification('Booking rejected successfully'),
      error: (err) => {
        booking.status = prev;
        this.showNotification(err.message || 'Failed to reject booking');
      },
    });
  }

  viewBooking(booking: CarWashBooking): void {
    this.openBookingDialog(booking, 'view');
  }

  markAsDone(booking: CarWashBooking): void {
    const prev = booking.status;
    booking.status = 'Completed';
    this.bookingService.updateBookingStatus(booking.id, 'Completed').subscribe({
      next: () => {
        this.showNotification(
          'Car wash completed successfully! Admin has been notified.'
        );
        this.loadBookings(); // Refresh the list to show updated status
      },
      error: (err) => {
        booking.status = prev;
        this.showNotification(
          err.message || 'Failed to mark booking as completed'
        );
      },
    });
  }

  filterBookings(status: string): CarWashBooking[] {
    if (this.selectedStatus === 'All') return this.bookings;
    const selected = this.selectedStatus.toLowerCase();
    return this.bookings.filter(
      (booking) => booking.status.toLowerCase() === selected
    );
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private normalizeStatus(
    status: string
  ): 'Pending' | 'Approved' | 'Rejected' | 'Completed' {
    const normalized = status?.toLowerCase().trim();

    switch (normalized) {
      case 'approved':
      case 'approve':
        return 'Approved';
      case 'completed':
      case 'complete':
      case 'done':
        return 'Completed';
      case 'rejected':
      case 'reject':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  completeBooking(booking: CarWashBooking): void {
    const prev = booking.status;
    booking.status = 'Completed';
    this.bookingService.updateBookingStatus(booking.id, 'Completed').subscribe({
      next: () => this.showNotification('Booking marked as completed'),
      error: (err) => {
        booking.status = prev;
        this.showNotification(err.message || 'Failed to complete booking');
      },
    });
  }

  private loadBookings(): void {
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
          this.bookings = bookings.map((b: any, idx: number) => {
            // Debug: Log the raw status from database
            console.log('Raw status from DB:', b.status);

            const normalizedStatus = this.normalizeStatus(
              b.status ?? 'Pending'
            );
            console.log('Normalized status:', normalizedStatus);

            return {
              id: Number(b.id ?? idx + 1),
              customerName: this.resolveCustomerName(
                b.customerName,
                b.nickname
              ),
              vehicleType: b.vehicleType ?? 'Unknown',
              date: b.washDate ?? '',
              time: b.washTime ?? '',
              status: normalizedStatus,
              serviceType: b.serviceName ?? 'Standard Wash',
              price: b.price ? Number(b.price) : undefined,
              imageUrl: 'assets/images/profile-placeholder.jpg',
            };
          });
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load bookings';
          this.loading = false;
          console.error('Error loading employee bookings:', err);
        },
      });
    } catch (error) {
      this.error = 'Failed to parse employee data';
      this.loading = false;
      console.error('Error parsing employee data:', error);
    }
  }

  private resolveCustomerName(dbFullName?: string, nickname?: string): string {
    const full = (dbFullName || '').trim();
    if (full.length > 0) return full;
    const nick = (nickname || '').trim();
    return nick.length > 0 ? nick : 'Customer';
  }

  private openBookingDialog(booking: CarWashBooking, mode: 'view') {
    const dialogRef = this.dialog.open(BookingDetailsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { booking: { ...booking }, mode },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.markAsDone) {
        this.markAsDone(booking);
      }
    });
  }
}

@Component({
  selector: 'app-booking-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>visibility</mat-icon>
          </div>
          <div class="header-text">
            <h2 class="modal-title">Car Wash Booking Details</h2>
            <p class="modal-subtitle">
              Review the complete booking information
            </p>
          </div>
        </div>
        <button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Customer Info Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">person</mat-icon>
            <h3>Customer Information</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Customer Name</span>
              <span class="value">{{ data.booking.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Vehicle Type</span>
              <span class="value">{{ data.booking.vehicleType }}</span>
            </div>
          </div>
        </div>

        <!-- Service Info Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">local_car_wash</mat-icon>
            <h3>Service Details</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Service Type</span>
              <span class="value">{{
                data.booking.serviceType || 'Standard Wash'
              }}</span>
            </div>
            <div class="info-item">
              <span class="label">Price</span>
              <span class="value price">{{
                data.booking.price | currency
              }}</span>
            </div>
          </div>
        </div>

        <!-- Schedule Info Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">schedule</mat-icon>
            <h3>Schedule</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Date</span>
              <span class="value">{{ data.booking.date }}</span>
            </div>
            <div class="info-item">
              <span class="label">Time</span>
              <span class="value">{{ data.booking.time }}</span>
            </div>
          </div>
        </div>

        <!-- Status Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">info</mat-icon>
            <h3>Status</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Current Status</span>
              <span
                class="status-chip status-{{
                  data.booking.status.toLowerCase()
                }}"
              >
                <span class="status-dot"></span>
                {{ data.booking.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="action-btn secondary-btn" (click)="onClose()">
          <mat-icon>close</mat-icon>
          Close
        </button>
        <button
          class="action-btn primary-btn"
          *ngIf="data.booking.status === 'Approved'"
          (click)="onMarkAsDone()"
        >
          <mat-icon>done_all</mat-icon>
          Mark as Done
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-container {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        min-width: 500px;
        max-width: 600px;
      }

      .modal-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-icon {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .modal-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
      }

      .modal-subtitle {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
        font-weight: 400;
      }

      .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .close-button mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .modal-content {
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .info-section {
        margin-bottom: 24px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .section-icon {
        color: #667eea;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .label {
        font-weight: 600;
        color: #475569;
        font-size: 14px;
      }

      .value {
        color: #1e293b;
        font-size: 14px;
        font-weight: 500;
      }

      .value.price {
        color: #059669;
        font-weight: 700;
        font-size: 16px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .status-pending {
        background: #fff7ed;
        color: #d97706;
        border: 1px solid #fde68a;
      }

      .status-approved {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }

      .status-rejected {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .status-completed {
        background: #f5f3ff;
        color: #7c3aed;
        border: 1px solid #ddd6fe;
      }

      .modal-actions {
        padding: 20px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }

      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .secondary-btn {
        background: #e2e8f0;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .secondary-btn:hover {
        background: #cbd5e1;
      }

      .primary-btn {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
      }

      .primary-btn:hover {
        background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      }

      /* Responsive Design */
      @media (max-width: 600px) {
        .modal-container {
          min-width: 90vw;
          margin: 20px;
        }

        .modal-header {
          padding: 20px;
        }

        .modal-content {
          padding: 20px;
        }

        .info-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .modal-actions {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class BookingDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BookingDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { booking: CarWashBooking; mode: 'view' }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onMarkAsDone(): void {
    this.dialogRef.close({ markAsDone: true });
  }
}
