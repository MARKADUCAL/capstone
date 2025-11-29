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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';
import { FeedbackService } from '../../../services/feedback.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface CarWashBooking {
  id: number;
  customerName: string;
  vehicleType: string;
  date: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Done' | 'Completed';
  serviceType?: string;
  price?: number | null;
  imageUrl?: string;
  plateNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  // Customer feedback fields
  customerRating?: number;
  customerRatingComment?: string;
  feedbackCreatedAt?: string;
  feedbackId?: number;
  // Employee feedback fields
  employeeRating?: number | null;
  employeeComment?: string | null;
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
  statusSections: {
    label: string;
    value: CarWashBooking['status'];
    description: string;
  }[] = [
    {
      label: 'Ongoing',
      value: 'Approved',
      description: 'Assigned to you - ready to work on',
    },
    {
      label: 'Done',
      value: 'Done',
      description: 'Service completed, awaiting admin review',
    },
    {
      label: 'Completed',
      value: 'Completed',
      description: 'Officially completed bookings',
    },
  ];
  private apiUrl = environment.apiUrl;

  constructor(
    private snackBar: MatSnackBar,
    private bookingService: BookingService,
    private feedbackService: FeedbackService,
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
      next: () =>
        Swal.fire({
          title: 'Booking Approved!',
          text: 'The booking status has been updated to Approved.',
          icon: 'success',
          confirmButtonColor: '#047857',
        }),
      error: (err) => {
        booking.status = prev;
        Swal.fire({
          title: 'Approval Failed',
          text: err.message || 'Failed to approve booking.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
      },
    });
  }

  rejectBooking(booking: CarWashBooking): void {
    const prev = booking.status;
    booking.status = 'Rejected';
    this.bookingService.updateBookingStatus(booking.id, 'Rejected').subscribe({
      next: () =>
        Swal.fire({
          title: 'Booking Rejected',
          text: 'The booking status has been updated to Rejected.',
          icon: 'success',
          confirmButtonColor: '#047857',
        }),
      error: (err) => {
        booking.status = prev;
        Swal.fire({
          title: 'Rejection Failed',
          text: err.message || 'Failed to reject booking.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
      },
    });
  }

  viewBooking(booking: CarWashBooking): void {
    this.openBookingDialog(booking, 'view');
  }

  markAsDone(booking: CarWashBooking): void {
    Swal.fire({
      title: 'Mark as Done?',
      text: 'Confirm that you have completed this car wash.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark as done',
      cancelButtonText: 'Cancel',
      focusCancel: true,
      confirmButtonColor: '#047857',
      cancelButtonColor: '#9ca3af',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const previousStatus = booking.status;
        booking.status = 'Done';

        this.bookingService.updateBookingStatus(booking.id, 'Done').subscribe({
          next: () => {
            Swal.fire({
              title: 'Marked as Done!',
              text: 'Admin has been notified to review this booking.',
              icon: 'success',
              confirmButtonColor: '#047857',
            });
            this.loadBookings();
          },
          error: (err) => {
            booking.status = previousStatus;
            Swal.fire({
              title: 'Update Failed',
              text:
                err.message ||
                'We could not update the booking status. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626',
            });
          },
        });
      }
    });
  }

  filterBookings(status: string): CarWashBooking[] {
    if (this.selectedStatus === 'All') return this.bookings;
    const selected = this.selectedStatus.toLowerCase();
    return this.bookings.filter(
      (booking) => booking.status.toLowerCase() === selected
    );
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    if (s.toLowerCase() === 'approved') return 'Ongoing';
    return s;
  }

  getBookingsByStatus(status: CarWashBooking['status']): CarWashBooking[] {
    const normalized = (status || '').toLowerCase();
    return this.bookings.filter(
      (booking) => (booking.status || '').toLowerCase() === normalized
    );
  }

  private normalizeStatus(
    status: string
  ): 'Pending' | 'Approved' | 'Rejected' | 'Done' | 'Completed' {
    const normalized = status?.toLowerCase().trim();

    switch (normalized) {
      case 'approved':
      case 'approve':
        return 'Approved';
      case 'done':
        return 'Done';
      case 'completed':
      case 'complete':
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
      next: () =>
        Swal.fire({
          title: 'Booking Completed',
          text: 'The booking has been marked as completed.',
          icon: 'success',
          confirmButtonColor: '#047857',
        }),
      error: (err) => {
        booking.status = prev;
        Swal.fire({
          title: 'Update Failed',
          text: err.message || 'Failed to complete booking.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
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
          this.bookings = bookings
            .map((b: any, idx: number) => {
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
                vehicleType: b.vehicleType ?? b.vehicle_type ?? 'Unknown',
                plateNumber: b.plateNumber ?? b.plate_number,
                vehicleModel: b.vehicleModel ?? b.vehicle_model,
                vehicleColor: b.vehicleColor ?? b.vehicle_color,
                date: b.washDate ? this.formatDate(b.washDate) : 'Date TBD',
                time: this.formatTime(b.washTime),
                status: normalizedStatus,
                serviceType: b.serviceName ?? 'Standard Wash',
                price: this.normalizePrice(b.price),
                imageUrl: 'assets/images/profile-placeholder.jpg',
              };
            })
            .filter((booking) => booking.status !== 'Pending');
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

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Date TBD';
    }

    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      return dateString;
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatTime(timeString?: string): string {
    if (!timeString) {
      return 'Time TBD';
    }

    const trimmed = timeString.trim();
    if (!trimmed || /^tbd$/i.test(trimmed)) {
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

    const parsed = new Date(`1970-01-01T${trimmed}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return trimmed;
  }

  private normalizePrice(price: any): number | null {
    if (price === null || price === undefined || price === '') {
      return null;
    }

    const numeric = Number(price);
    if (isNaN(numeric)) {
      return null;
    }

    return Math.round(numeric * 100) / 100;
  }

  private resolveCustomerName(dbFullName?: string, nickname?: string): string {
    const full = (dbFullName || '').trim();
    if (full.length > 0) return full;
    const nick = (nickname || '').trim();
    return nick.length > 0 ? nick : 'Customer';
  }

  private openBookingDialog(booking: CarWashBooking, mode: 'view') {
    // Always load feedback data for all bookings
    const bookingWithFeedback = { ...booking };

    console.log('Loading feedback for booking ID:', booking.id);
    this.feedbackService.getFeedbackByBookingId(booking.id).subscribe({
      next: (feedbackList) => {
        console.log('Feedback list received:', feedbackList);
        if (feedbackList && feedbackList.length > 0) {
          const feedback = feedbackList[0];
          console.log('Setting feedback data:', feedback);
          // General feedback
          bookingWithFeedback.customerRating = feedback.rating;
          bookingWithFeedback.customerRatingComment = feedback.comment || '';
          bookingWithFeedback.feedbackCreatedAt = feedback.created_at;
          bookingWithFeedback.feedbackId = feedback.id;
          // Employee feedback
          bookingWithFeedback.employeeRating = feedback.employee_rating;
          bookingWithFeedback.employeeComment = feedback.employee_comment;
          console.log('Booking with feedback:', bookingWithFeedback);
        } else {
          console.log('No feedback found for booking ID:', booking.id);
        }
        this.openDialog(bookingWithFeedback, mode);
      },
      error: (err) => {
        console.error('Error loading feedback:', err);
        this.openDialog(bookingWithFeedback, mode);
      },
    });
  }

  private openDialog(booking: CarWashBooking, mode: 'view') {
    const dialogRef = this.dialog.open(BookingDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { booking, mode },
      panelClass: 'booking-details-dialog',
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
            <div class="info-item">
              <span class="label">Plate Number</span>
              <span class="value">{{ data.booking.plateNumber || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Vehicle Model</span>
              <span class="value">{{
                data.booking.vehicleModel || 'N/A'
              }}</span>
            </div>
            <div class="info-item">
              <span class="label">Vehicle Color</span>
              <span class="value">{{
                data.booking.vehicleColor || 'N/A'
              }}</span>
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
              <span class="value price"
                >₱{{ data.booking.price | number : '1.2-2' }}</span
              >
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
              <span class="value">{{
                formatTimeForUnknownVehicle(
                  data.booking.time || '',
                  data.booking.vehicleType
                )
              }}</span>
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

        <!-- Employee Feedback Section (if employee feedback exists for completed bookings) -->
        <div
          class="info-section employee-feedback-section"
          *ngIf="
            data.booking.status === 'Completed' &&
            (data.booking.employeeRating || data.booking.employeeComment)
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">rate_review</mat-icon>
            <h3>Customer Feedback (Employee)</h3>
          </div>
          <div class="info-grid">
            <div class="info-item" *ngIf="data.booking.employeeRating">
              <span class="label">Rating</span>
              <span class="value rating-display">
                <span class="stars">{{
                  getStarDisplay(data.booking.employeeRating || 0)
                }}</span>
                <span class="rating-value"
                  >{{ data.booking.employeeRating }}/5</span
                >
              </span>
            </div>
            <div
              class="info-item notes-item"
              *ngIf="data.booking.employeeComment"
            >
              <span class="label">Comment</span>
              <span class="value notes-text employee-feedback-text">{{
                data.booking.employeeComment
              }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.feedbackCreatedAt">
              <span class="label">Submitted On</span>
              <span class="value">{{
                formatDate(data.booking.feedbackCreatedAt)
              }}</span>
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

      .notes-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .notes-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 100%;
        line-height: 1.5;
      }

      .rating-display {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stars {
        color: #fbbf24;
        font-size: 18px;
        letter-spacing: 2px;
      }

      .rating-value {
        font-weight: 600;
        color: #1e293b;
      }

      .customer-feedback-text {
        background: #fefce8;
        border: 1px solid #fde047;
        border-radius: 8px;
        padding: 12px;
        color: #713f12;
        font-weight: 500;
      }

      .employee-feedback-section {
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        border: 1px solid #e0e7ff;
        border-radius: 12px;
        padding: 20px;
        margin-top: 20px;
      }

      .employee-feedback-section .section-header h3 {
        color: #6366f1;
      }

      .employee-feedback-section .section-icon {
        color: #6366f1;
      }

      .employee-feedback-text {
        background: #f0f4ff;
        border: 1px solid #c7d2fe;
        border-radius: 8px;
        padding: 12px;
        color: #4338ca;
        font-weight: 500;
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
  ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

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

  formatTimeForUnknownVehicle(timeString: string, vehicleType: string): string {
    // If vehicle type is "Unknown", format time as 1:00pm or 1:00am
    if (vehicleType === 'Unknown') {
      // Check if it's currently morning or afternoon based on current time
      const now = new Date();
      const isMorning = now.getHours() < 12;
      return isMorning ? '1:00 AM' : '1:00 PM';
    }

    // For other vehicle types, format the time to 12-hour format with AM/PM
    if (timeString) {
      return this.formatTimeTo12Hour(timeString);
    }

    return 'Time TBD';
  }

  formatTimeTo12Hour(timeString: string): string {
    try {
      // Handle different time formats (HH:MM:SS, HH:MM, etc.)
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        if (isNaN(hours) || isNaN(minutes)) {
          return timeString; // Return original if parsing fails
        }

        // Convert to 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');

        return `${displayHours}:${displayMinutes} ${period}`;
      }
    } catch (error) {
      console.warn('Error formatting time:', error);
    }

    return timeString; // Return original if formatting fails
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return '';
    }
  }

  getStarDisplay(rating: number): string {
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) {
      stars += '☆';
    }
    return stars;
  }

  getRatingText(rating: number): string {
    if (!rating || rating < 0 || rating >= this.ratingTexts.length) {
      return '';
    }
    return this.ratingTexts[Math.round(rating)] || '';
  }
}
