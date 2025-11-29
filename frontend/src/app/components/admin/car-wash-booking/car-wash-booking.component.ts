import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';
import { FeedbackService } from '../../../services/feedback.service';
import { environment } from '../../../../environments/environment';
import { Employee } from '../../../models/booking.model';
import Swal from 'sweetalert2';
import {
  VEHICLE_TYPE_CODES,
  SERVICE_CODES,
  PAYMENT_TYPES,
  ONLINE_PAYMENT_OPTIONS,
} from '../../../models/booking.model';

const SERVICE_PACKAGE_DETAILS: Record<
  string,
  { label: string; description: string }
> = {
  p1: {
    label: 'Wash only',
    description: 'Exterior wash focused on removing dirt and surface grime.',
  },
  p2: {
    label: 'Wash / Vacuum',
    description:
      'Exterior wash with complete interior vacuum for seats, mats, and cargo area.',
  },
  p3: {
    label: 'Wash / Vacuum / Hand Wax',
    description:
      'Wash and vacuum service finished with protective hand wax for added shine.',
  },
  p4: {
    label: 'Wash / Vacuum / Buffing Wax',
    description:
      'Full wash and vacuum including machine buffing wax for long-lasting gloss.',
  },
};

const SERVICE_PACKAGE_CODE_SET = new Set(Object.keys(SERVICE_PACKAGE_DETAILS));

interface CarWashBooking {
  id: number;
  customerName: string;
  vehicleType: string;
  date: string;
  time: string;
  status:
    | 'Pending'
    | 'Approved'
    | 'Rejected'
    | 'Done'
    | 'Completed'
    | 'Cancelled'
    | 'Expired';
  serviceType?: string;
  price?: number;
  imageUrl?: string;
  notes?: string;
  // Additional fields for comprehensive details
  servicePackageCode?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  phone?: string;
  additionalPhone?: string;
  paymentType?: string;
  onlinePaymentOption?: string;
  serviceDescription?: string;
  serviceDuration?: number;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
  employeeFirstName?: string;
  employeeLastName?: string;
  employeePosition?: string;
  dateCreated?: string;
  washDate?: string;
  washTime?: string;
  serviceName?: string;
  rejectionReason?: string;
  adminComment?: string;
  adminCommentedAt?: string;
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
  // Service feedback fields
  serviceRating?: number | null;
  serviceComment?: string | null;
}

// Simple confirmation dialog for destructive actions
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div style="padding:20px;min-width:380px">
      <h2
        mat-dialog-title
        style="margin:0 0 8px 0;display:flex;align-items:center;gap:8px"
      >
        <mat-icon color="warn">delete</mat-icon>
        Delete Booking
      </h2>
      <mat-dialog-content>
        <p>
          Are you sure you want to delete booking #{{ data.id }} for
          <b>{{ data.name }}</b
          >? This action cannot be undone.
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" style="margin-top:12px">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="warn" (click)="confirm()">
          Delete
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { id: number; name: string }
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }
}

// Rejection Dialog Component
@Component({
  selector: 'app-rejection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="rejection-dialog">
      <h2 mat-dialog-title>Decline Booking</h2>
      <mat-dialog-content>
        <p>Please provide a reason for declining this booking:</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Decline Reason</mat-label>
          <textarea
            matInput
            [(ngModel)]="rejectionReason"
            placeholder="Enter the reason for decline..."
            rows="4"
            required
          ></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button
          mat-raised-button
          color="warn"
          [disabled]="!rejectionReason || !rejectionReason.trim()"
          (click)="confirmRejection()"
        >
          Decline Booking
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .rejection-dialog {
        padding: 20px;
        min-width: 400px;
      }
      .full-width {
        width: 100%;
      }
      mat-dialog-actions {
        margin-top: 20px;
      }
    `,
  ],
})
export class RejectionDialogComponent {
  rejectionReason: string = '';

  constructor(
    public dialogRef: MatDialogRef<RejectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: CarWashBooking }
  ) {}

  confirmRejection(): void {
    if (this.rejectionReason?.trim()) {
      this.dialogRef.close(this.rejectionReason.trim());
    }
  }
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
    MatProgressSpinnerModule,
    MatDialogModule,
    MatInputModule,
  ],
  templateUrl: './car-wash-booking.component.html',
  styleUrl: './car-wash-booking.component.css',
})
export class CarWashBookingComponent implements OnInit {
  bookings: CarWashBooking[] = [];
  statusSections: {
    label: string;
    value: CarWashBooking['status'];
    description: string;
  }[] = [
    {
      label: 'Pending',
      value: 'Pending',
      description: 'Awaiting admin approval',
    },
    {
      label: 'Ongoing',
      value: 'Approved',
      description: 'Ongoing and awaiting employee assignment/completion',
    },
    {
      label: 'Done',
      value: 'Done',
      description: 'Service completed by staff, awaiting confirmation',
    },
    {
      label: 'Completed',
      value: 'Completed',
      description: 'Officially completed bookings',
    },
    {
      label: 'Declined',
      value: 'Rejected',
      description: 'Declined or rejected booking requests',
    },
    {
      label: 'Cancelled',
      value: 'Cancelled',
      description: 'Bookings cancelled by admin or customer',
    },
    {
      label: 'Expired',
      value: 'Expired',
      description: 'Pending bookings whose scheduled date has passed',
    },
  ];
  employees: Employee[] = [];
  loading: boolean = false;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  constructor(
    private bookingService: BookingService,
    private feedbackService: FeedbackService,
    private dialog: MatDialog,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadEmployees();
  }

  openCreateBooking(): void {
    const dialogRef = this.dialog.open(CreateWalkInBookingDialogComponent, {
      width: '640px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.showNotification('Booking created successfully');
        setTimeout(() => this.loadBookings(), 500);
      }
    });
  }

  approveBooking(booking: CarWashBooking): void {
    // Open employee assignment dialog instead of directly approving
    const dialogRef = this.dialog.open(EmployeeAssignmentDialogComponent, {
      width: '500px',
      data: {
        booking: booking,
        employees: this.employees,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.employeeId) {
        const selected = this.employees.find((e) => e.id === result.employeeId);
        if (!selected) {
          this.showNotification('Unable to find the selected employee.');
          return;
        }
        // Assign employee and approve booking
        this.bookingService
          .assignEmployeeToBooking(booking.id, result.employeeId)
          .subscribe({
            next: () => {
              // Update the booking status to Approved
              this.bookingService
                .updateBookingStatus(booking.id, 'Approved')
                .subscribe({
                  next: () => {
                    Swal.fire({
                      icon: 'success',
                      title: 'Booking Approved',
                      text: 'Employee assigned and booking approved successfully.',
                      confirmButtonColor: '#2563eb',
                    });
                    this.showNotification(
                      'Employee assigned and booking approved successfully'
                    );
                    // Refresh the list to get updated employee information
                    setTimeout(() => {
                      this.loadBookings();
                    }, 1000); // Increased delay to ensure backend has processed the assignment
                  },
                  error: (statusErr) => {
                    console.error('Error updating booking status:', statusErr);
                    this.showNotification(
                      'Employee assigned but failed to update booking status'
                    );
                    // Still refresh the list
                    setTimeout(() => {
                      this.loadBookings();
                    }, 500);
                  },
                });
            },
            error: (err) => {
              this.showNotification(
                err.message || 'Failed to assign employee and approve booking'
              );
            },
          });
      }
    });
  }

  rejectBooking(booking: CarWashBooking): void {
    const dialogRef = this.dialog.open(RejectionDialogComponent, {
      width: '500px',
      data: { booking },
    });

    dialogRef.afterClosed().subscribe((reason: string) => {
      if (reason) {
        // Show SweetAlert confirmation before declining
        Swal.fire({
          title: 'Decline Booking?',
          html: `
            <p>Are you sure you want to decline this booking?</p>
            <p style="margin-top: 10px; font-weight: 600;">Reason:</p>
            <p style="background: #fef2f2; padding: 10px; border-radius: 6px; color: #dc2626; margin-top: 5px;">
              ${reason}
            </p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Decline Booking',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          focusCancel: true,
        }).then((result) => {
          if (result.isConfirmed) {
            const prev = booking.status;
            booking.status = 'Rejected';
            booking.rejectionReason = reason;

            this.bookingService
              .updateBookingStatus(booking.id, 'Rejected', reason)
              .subscribe({
                next: () => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Booking Declined',
                    text: 'The booking has been declined successfully.',
                    confirmButtonColor: '#dc2626',
                  });
                  this.loadBookings(); // Refresh the bookings list
                },
                error: (err) => {
                  booking.status = prev;
                  delete booking.rejectionReason;
                  Swal.fire({
                    icon: 'error',
                    title: 'Decline Failed',
                    text:
                      err.message ||
                      'Failed to decline booking. Please try again.',
                    confirmButtonColor: '#dc2626',
                  });
                },
              });
          }
        });
      }
    });
  }

  viewBooking(booking: CarWashBooking): void {
    this.openBookingDialog(booking, 'view');
  }

  editBooking(booking: CarWashBooking): void {
    this.openBookingDialog(booking, 'edit');
  }

  canEditBooking(booking: CarWashBooking): boolean {
    const status = booking.status as string;
    return (
      status !== 'Rejected' &&
      status !== 'Cancelled' &&
      status !== 'Pending' &&
      status !== 'Approved' &&
      status !== 'Done' &&
      status !== 'Completed'
    );
  }

  deleteBooking(booking: CarWashBooking): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '420px',
      data: { id: booking.id, name: booking.customerName },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      // Optimistic UI: remove from list immediately
      const index = this.bookings.findIndex((b) => b.id === booking.id);
      const backup = index !== -1 ? { ...this.bookings[index] } : null;
      if (index !== -1) this.bookings.splice(index, 1);

      // Backend: mark as Cancelled (soft delete) to match existing API
      this.bookingService
        .updateBookingStatus(booking.id, 'Cancelled')
        .subscribe({
          next: () => this.showNotification('Booking deleted'),
          error: (err) => {
            // Rollback on failure
            if (backup) this.bookings.splice(index, 0, backup);
            this.showNotification(err.message || 'Failed to delete booking');
          },
        });
    });
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // Display-friendly mapping for status labels
  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    if (s.toLowerCase() === 'approved') return 'Ongoing';
    if (s.toLowerCase() === 'expired') return 'Expired';
    return s;
  }

  // Check if a booking date has passed (is in the past)
  private isBookingDatePassed(dateString: string): boolean {
    if (!dateString) return false;
    const trimmed = String(dateString).trim();
    if (
      trimmed === '0000-00-00' ||
      trimmed === '0000-00-00 00:00:00' ||
      trimmed.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    const bookingDate = new Date(trimmed);
    if (isNaN(bookingDate.getTime())) return false;

    // Set booking date to end of day for comparison
    bookingDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookingDate < today;
  }

  // Mark pending bookings as expired if their date has passed
  private markExpiredBookings(): void {
    const expiredBookingIds: number[] = [];

    this.bookings.forEach((booking) => {
      if (
        booking.status === 'Pending' &&
        this.isBookingDatePassed(booking.date || booking.washDate || '')
      ) {
        // Mark locally as expired
        booking.status = 'Expired';
        expiredBookingIds.push(booking.id);
      }
    });

    // Update expired bookings in the backend
    expiredBookingIds.forEach((bookingId) => {
      this.bookingService.updateBookingStatus(bookingId, 'Expired').subscribe({
        next: () => {
          console.log(`Booking #${bookingId} marked as Expired`);
        },
        error: (err) => {
          console.error(
            `Failed to mark booking #${bookingId} as Expired:`,
            err
          );
        },
      });
    });

    if (expiredBookingIds.length > 0) {
      this.showNotification(
        `${expiredBookingIds.length} pending booking(s) marked as expired`
      );
    }
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  completeBooking(booking: CarWashBooking): void {
    // Show confirmation dialog before completing
    Swal.fire({
      title: 'Complete Booking?',
      html: `
        <div style="text-align: left; padding: 10px 0;">
          <p style="margin-bottom: 12px;">Are you sure you want to mark this booking as completed?</p>
          <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534;">Booking Details:</p>
            <p style="margin: 4px 0; color: #15803d;"><strong>Customer:</strong> ${
              booking.customerName
            }</p>
            <p style="margin: 4px 0; color: #15803d;"><strong>Service:</strong> ${
              booking.serviceType || 'Standard Wash'
            }</p>
            <p style="margin: 4px 0; color: #15803d;"><strong>Booking ID:</strong> #${
              booking.id
            }</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete Booking',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const prev = booking.status;
        booking.status = 'Completed';
        this.bookingService
          .updateBookingStatus(booking.id, 'Completed')
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: '🎉 Booking Completed!',
                html: `
                <div style="text-align: center;">
                  <p style="font-size: 16px; margin-bottom: 8px;">Booking #${booking.id} has been successfully completed.</p>
                  <p style="color: #059669; font-weight: 600;">Customer: ${booking.customerName}</p>
                </div>
              `,
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'Great!',
              });
              this.showNotification('Booking marked as completed');
              // Refresh to update the list
              this.loadBookings();
            },
            error: (err) => {
              booking.status = prev;
              Swal.fire({
                icon: 'error',
                title: 'Completion Failed',
                text:
                  err.message ||
                  'Failed to complete booking. Please try again.',
                confirmButtonColor: '#dc2626',
              });
            },
          });
      }
    });
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.map((b: any, idx: number) => {
          const servicePackageCode = this.extractServicePackageCode(b);
          const serviceDetails = servicePackageCode
            ? SERVICE_PACKAGE_DETAILS[servicePackageCode]
            : undefined;
          const rawServiceName =
            b.serviceName ?? b.service_name ?? b.serviceType ?? b.service_type;
          const shouldUseDetailsLabel =
            !rawServiceName ||
            this.normalizeServicePackageCode(rawServiceName) !== null;
          const resolvedServiceType =
            (shouldUseDetailsLabel
              ? serviceDetails?.label || rawServiceName
              : rawServiceName) || 'Standard Wash';
          const resolvedServiceDescription =
            b.serviceDescription ??
            b.service_description ??
            serviceDetails?.description;

          const booking = {
            id: Number(b.id ?? idx + 1),
            customerName: this.resolveCustomerName(
              b.customerName,
              b.nickname,
              b.firstName ?? b.first_name,
              b.lastName ?? b.last_name
            ),
            vehicleType: b.vehicleType ?? b.vehicle_type ?? 'Unknown',
            plateNumber: b.plateNumber ?? b.plate_number,
            vehicleModel: b.vehicleModel ?? b.vehicle_model,
            vehicleColor: b.vehicleColor ?? b.vehicle_color,
            date: b.washDate ?? b.wash_date ?? '',
            time: b.washTime ?? b.wash_time ?? '',
            status: (b.status ?? 'Pending') as
              | 'Pending'
              | 'Approved'
              | 'Rejected'
              | 'Done'
              | 'Completed'
              | 'Cancelled'
              | 'Expired',
            serviceType: resolvedServiceType,
            price: b.price ? Number(b.price) : undefined,
            imageUrl: 'assets/images/profile-placeholder.jpg',
            notes: b.notes ?? undefined,
            // Additional comprehensive details
            servicePackageCode: servicePackageCode ?? undefined,
            firstName: b.firstName ?? b.first_name,
            lastName: b.lastName ?? b.last_name,
            nickname: b.nickname,
            phone: b.phone,
            additionalPhone: b.additionalPhone ?? b.additional_phone,
            paymentType: b.paymentType ?? b.payment_type,
            onlinePaymentOption:
              b.onlinePaymentOption ?? b.online_payment_option,
            serviceDescription: resolvedServiceDescription,
            serviceDuration: b.serviceDuration ?? b.service_duration,
            assignedEmployeeId: b.assignedEmployeeId ?? b.assigned_employee_id,
            assignedEmployeeName:
              b.assignedEmployeeName ?? b.assigned_employee_name,
            employeeFirstName: b.employeeFirstName ?? b.employee_first_name,
            employeeLastName: b.employeeLastName ?? b.employee_last_name,
            employeePosition: b.employeePosition ?? b.employee_position,
            dateCreated: b.dateCreated ?? b.date_created ?? b.created_at,
            washDate: b.washDate ?? b.wash_date,
            washTime: b.washTime ?? b.wash_time,
            serviceName: b.serviceName ?? b.service_name,
            rejectionReason: b.rejectionReason ?? b.rejection_reason,
            adminComment: b.adminComment ?? b.admin_comment,
            adminCommentedAt: b.adminCommentedAt ?? b.admin_commented_at,
          };

          return booking;
        });

        // Check for expired pending bookings
        this.markExpiredBookings();

        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load bookings';
        this.loading = false;
        this.showNotification(err.message || 'Failed to load bookings');
      },
    });
  }

  private extractServicePackageCode(raw: any): string | null {
    if (!raw) return null;

    const candidates = [
      raw.servicePackage,
      raw.service_package,
      raw.servicePackageCode,
      raw.service_package_code,
      raw.serviceCode,
      raw.service_code,
      raw.serviceName,
      raw.service_name,
      raw.serviceType,
      raw.service_type,
    ];

    for (const candidate of candidates) {
      const code = this.normalizeServicePackageCode(candidate);
      if (code) {
        return code;
      }
    }

    return null;
  }

  private normalizeServicePackageCode(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    if (!text) return null;

    const lower = text.toLowerCase();

    if (SERVICE_PACKAGE_CODE_SET.has(lower)) {
      return lower;
    }

    if (/^p\d$/.test(lower)) {
      return SERVICE_PACKAGE_CODE_SET.has(lower) ? lower : null;
    }

    if (/^\d$/.test(lower)) {
      const prefixed = `p${lower}`;
      return SERVICE_PACKAGE_CODE_SET.has(prefixed) ? prefixed : null;
    }

    const hyphenIndex = lower.indexOf('-');
    if (hyphenIndex > 0) {
      const prefix = lower.slice(0, hyphenIndex).trim();
      const normalized = this.normalizeServicePackageCode(prefix);
      if (normalized) {
        return normalized;
      }
    }

    if (lower.includes(' ')) {
      const pieces = lower.split(/\s+/);
      for (const piece of pieces) {
        if (!piece || piece === lower) continue;
        const normalized = this.normalizeServicePackageCode(piece);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  private resolveCustomerName(
    dbFullName?: string,
    nickname?: string,
    firstName?: string,
    lastName?: string
  ): string {
    // Prioritize firstName + lastName combination
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    if (first.length > 0 || last.length > 0) {
      return `${first} ${last}`.trim();
    }
    // Fallback to dbFullName
    const full = (dbFullName || '').trim();
    if (full.length > 0) return full;
    // Fallback to nickname or default
    const nick = (nickname || '').trim();
    return nick.length > 0 ? nick : 'Walk-in Customer';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const trimmed = String(dateString).trim();
    // Handle common invalid placeholders
    if (
      trimmed === '0000-00-00' ||
      trimmed === '0000-00-00 00:00:00' ||
      trimmed.toLowerCase() === 'invalid date'
    )
      return '';

    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
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
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');

        return `${displayHours}:${displayMinutes}${period}`;
      }
    } catch (error) {
      console.warn('Error formatting time:', error);
    }

    return timeString; // Return original if formatting fails
  }

  private openBookingDialog(booking: CarWashBooking, mode: 'view' | 'edit') {
    // Load feedback data for completed bookings
    const bookingWithFeedback = { ...booking };

    if (booking.status === 'Completed') {
      this.feedbackService.getFeedbackByBookingId(booking.id).subscribe({
        next: (feedbackList) => {
          if (feedbackList && feedbackList.length > 0) {
            const feedback = feedbackList[0];
            // General feedback
            bookingWithFeedback.customerRating = feedback.rating;
            bookingWithFeedback.customerRatingComment = feedback.comment;
            bookingWithFeedback.feedbackCreatedAt = feedback.created_at;
            bookingWithFeedback.feedbackId = feedback.id;
            // Employee feedback
            bookingWithFeedback.employeeRating = feedback.employee_rating;
            bookingWithFeedback.employeeComment = feedback.employee_comment;
            // Service feedback
            bookingWithFeedback.serviceRating = feedback.service_rating;
            bookingWithFeedback.serviceComment = feedback.service_comment;
          }
          this.openDialog(bookingWithFeedback, mode);
        },
        error: (err) => {
          console.error('Error loading feedback:', err);
          this.openDialog(bookingWithFeedback, mode);
        },
      });
    } else {
      this.openDialog(bookingWithFeedback, mode);
    }
  }

  private openDialog(booking: CarWashBooking, mode: 'view' | 'edit') {
    const isMobile = window.innerWidth <= 768;
    const dialogRef = this.dialog.open(BookingDetailsDialogComponent, {
      width: isMobile ? '100vw' : '520px',
      maxWidth: isMobile ? '100vw' : '600px',
      height: isMobile ? '100vh' : 'auto',
      maxHeight: isMobile ? '100vh' : '90vh',
      panelClass: isMobile ? 'mobile-dialog' : '',
      data: { booking, mode },
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result?: { id: number; status: CarWashBooking['status'] }) => {
          if (!result) return;
          const { id, status } = result;
          const index = this.bookings.findIndex((b) => b.id === id);
          if (index === -1) return;

          const prev = this.bookings[index].status;
          this.bookings[index].status = status;
          this.bookingService.updateBookingStatus(id, status).subscribe({
            next: () => this.showNotification('Booking updated'),
            error: (err) => {
              this.bookings[index].status = prev;
              this.showNotification(err.message || 'Failed to update booking');
            },
          });
        }
      );
  }

  loadEmployees(): void {
    this.http.get(`${this.apiUrl}/get_all_employees`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload &&
          response.payload.employees
        ) {
          this.employees = response.payload.employees.map((employee: any) => {
            return {
              id: employee.id,
              employeeId: employee.employee_id,
              name: `${employee.first_name} ${employee.last_name}`,
              email: employee.email,
              phone: employee.phone || 'N/A',
              registrationDate: this.formatDate(employee.created_at),
            };
          });
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      },
    });
  }

  // Method to refresh a specific booking's data
  private refreshBookingData(bookingId: number): void {
    // Find the booking in the current list and update it
    const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
    if (bookingIndex !== -1) {
      // Update the status to Approved after employee assignment
      this.bookings[bookingIndex].status = 'Approved';

      // You could also make an API call to get the latest booking data
      // this.bookingService.getBookingById(bookingId).subscribe(...)
    }
  }

  getBookingsByStatus(status: CarWashBooking['status']): CarWashBooking[] {
    const normalized = (status || '').toLowerCase();
    return this.bookings.filter(
      (booking) => (booking.status || '').toLowerCase() === normalized
    );
  }

  toggleMobileMenu(): void {
    // This can be connected to a sidebar service if needed
    console.log('Mobile menu toggled');
  }
}

@Component({
  selector: 'app-create-walkin-booking-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-content">
          <div class="header-icon"><mat-icon>add_circle</mat-icon></div>
          <div class="header-text">
            <h2 class="modal-title">Create Booking (Walk-in)</h2>
            <p class="modal-subtitle">Book for customers without an account</p>
          </div>
        </div>
        <button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form #f="ngForm">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Customer Nickname *</mat-label>
              <input
                matInput
                [(ngModel)]="form.nickname"
                name="nickname"
                required
              />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone *</mat-label>
              <input matInput [(ngModel)]="form.phone" name="phone" required />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Type *</mat-label>
              <mat-select
                [(ngModel)]="form.vehicle_type"
                name="vehicle_type"
                required
              >
                <mat-option *ngFor="let v of vehicleTypes" [value]="v">{{
                  v
                }}</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Vehicle Information Section -->
            <div class="section-divider full">
              <div class="section-header">
                <mat-icon class="section-icon">directions_car</mat-icon>
                <h3 class="section-title">Vehicle Information</h3>
              </div>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Plate Number *</mat-label>
              <input
                matInput
                [(ngModel)]="form.plate_number"
                name="plate_number"
                required
                maxlength="20"
              />
              <mat-icon matSuffix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Model *</mat-label>
              <input
                matInput
                [(ngModel)]="form.vehicle_model"
                name="vehicle_model"
                required
                placeholder="e.g., Toyota Vios, Honda Civic"
                maxlength="50"
              />
              <mat-icon matSuffix>directions_car</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Color</mat-label>
              <input
                matInput
                [(ngModel)]="form.vehicle_color"
                name="vehicle_color"
                placeholder="e.g., Red, Blue, White (optional)"
                maxlength="30"
              />
              <mat-icon matSuffix>palette</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Service Package *</mat-label>
              <mat-select
                [(ngModel)]="form.service_package"
                name="service_package"
                required
              >
                <mat-option *ngFor="let s of serviceCodes" [value]="s">{{
                  s
                }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Wash Date *</mat-label>
              <input
                matInput
                type="date"
                [(ngModel)]="form.wash_date"
                name="wash_date"
                [min]="getMinDate()"
                required
              />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Wash Time *</mat-label>
              <input
                matInput
                type="time"
                [(ngModel)]="form.wash_time"
                name="wash_time"
                required
              />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Payment Type *</mat-label>
              <mat-select
                [(ngModel)]="form.payment_type"
                name="payment_type"
                required
              >
                <mat-option *ngFor="let p of paymentTypes" [value]="p">{{
                  p
                }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              *ngIf="form.payment_type === 'Online Payment'"
            >
              <mat-label>Online Method *</mat-label>
              <mat-select
                [(ngModel)]="form.online_payment_option"
                name="online_payment_option"
                required
              >
                <mat-option
                  *ngFor="let o of onlinePaymentOptions"
                  [value]="o"
                  >{{ o }}</mat-option
                >
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Assign Employee *</mat-label>
              <mat-select
                [(ngModel)]="form.assigned_employee_id"
                name="assigned_employee_id"
                required
              >
                <mat-option
                  *ngFor="let employee of employees"
                  [value]="employee.id"
                >
                  {{ employee.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Notes</mat-label>
              <textarea
                matInput
                rows="3"
                [(ngModel)]="form.notes"
                name="notes"
              ></textarea>
            </mat-form-field>
          </div>
        </form>
      </div>

      <div class="modal-actions">
        <button class="action-btn secondary-btn" (click)="onClose()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button
          class="action-btn primary-btn"
          [disabled]="!isValid() || submitting"
          (click)="onCreate()"
        >
          <mat-icon>save</mat-icon>
          {{ submitting ? 'Creating...' : 'Create Booking' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-container {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        min-width: 560px;
        max-width: 720px;
      }
      .modal-header {
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
        color: #fff;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .header-content {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .header-icon {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 10px;
      }
      .modal-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
      .modal-subtitle {
        margin: 0;
        opacity: 0.95;
      }
      .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: #fff;
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
      }
      .modal-content {
        padding: 20px;
        max-height: 60vh;
        overflow: auto;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .full {
        grid-column: 1 / -1;
      }
      .section-divider {
        margin: 16px 0 8px 0;
        padding: 12px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon {
        color: #0ea5e9;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }
      .modal-actions {
        padding: 16px 20px;
        background: #f8fafc;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .secondary-btn {
        background: #e2e8f0;
        color: #475569;
      }
      .primary-btn {
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
        color: #fff;
      }
      @media (max-width: 640px) {
        .modal-container {
          min-width: 90vw;
        }
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CreateWalkInBookingDialogComponent {
  vehicleTypes = VEHICLE_TYPE_CODES;
  serviceCodes = SERVICE_CODES;
  paymentTypes = PAYMENT_TYPES;
  onlinePaymentOptions = ONLINE_PAYMENT_OPTIONS;
  employees: Employee[] = [];
  submitting = false;

  form: any = {
    customer_id: 999, // Use 999 for walk-in customers (backend expects non-zero value)
    vehicle_type: '',
    plate_number: '',
    vehicle_model: '',
    vehicle_color: '',
    service_package: '',
    nickname: '',
    phone: '',
    wash_date: '',
    wash_time: '',
    payment_type: '',
    online_payment_option: '',
    assigned_employee_id: null,
    notes: '',
  };

  constructor(
    private bookingService: BookingService,
    public dialogRef: MatDialogRef<CreateWalkInBookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.loadEmployees();
  }

  isValid(): boolean {
    if (!this.form.nickname?.trim()) return false;
    if (!this.form.phone?.trim()) return false;
    if (!this.form.vehicle_type) return false;
    if (!this.form.plate_number?.trim()) return false;
    if (!this.form.vehicle_model?.trim()) return false;
    if (!this.form.service_package) return false;
    if (!this.form.wash_date) return false;
    if (!this.form.wash_time) return false;
    if (!this.form.payment_type) return false;
    if (!this.form.assigned_employee_id) return false;
    if (
      this.form.payment_type === 'Online Payment' &&
      !this.form.online_payment_option
    )
      return false;
    return true;
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  loadEmployees(): void {
    this.http.get(`${environment.apiUrl}/get_all_employees`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload &&
          response.payload.employees
        ) {
          this.employees = response.payload.employees.map((employee: any) => {
            return {
              id: employee.id,
              employeeId: employee.employee_id,
              name: `${employee.first_name} ${employee.last_name}`,
              email: employee.email,
              phone: employee.phone || 'N/A',
              registrationDate: this.formatDate(employee.created_at),
            };
          });
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Failed to load employees', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const trimmed = String(dateString).trim();
    if (
      trimmed === '0000-00-00' ||
      trimmed === '0000-00-00 00:00:00' ||
      trimmed.toLowerCase() === 'invalid date'
    )
      return '';

    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (!this.isValid() || this.submitting) return;
    this.submitting = true;

    // Validate date is not in the past
    const selectedDate = new Date(this.form.wash_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.snackBar.open(
        'Please select a future date for the booking',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        }
      );
      this.submitting = false;
      return;
    }

    // Prepare payload with proper data structure for backend
    const payload = {
      customer_id: this.form.customer_id,
      vehicle_type: this.form.vehicle_type,
      plate_number: this.form.plate_number.trim(),
      vehicle_model: this.form.vehicle_model.trim(),
      vehicle_color: this.form.vehicle_color?.trim() || null,
      service_package: this.form.service_package,
      nickname: this.form.nickname.trim(),
      phone: this.form.phone.trim(),
      wash_date: this.form.wash_date,
      wash_time: this.form.wash_time,
      payment_type: this.form.payment_type,
      online_payment_option: this.form.online_payment_option || null,
      notes: this.form.notes?.trim() || null,
    };

    // Additional validation to ensure no empty strings are sent
    if (
      !payload.nickname ||
      !payload.phone ||
      !payload.vehicle_type ||
      !payload.plate_number ||
      !payload.vehicle_model ||
      !payload.service_package ||
      !payload.wash_date ||
      !payload.wash_time ||
      !payload.payment_type
    ) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this.submitting = false;
      return;
    }

    console.log('Creating booking with payload:', payload);
    console.log('Payload validation:');
    console.log(
      '- customer_id:',
      payload.customer_id,
      typeof payload.customer_id
    );
    console.log(
      '- vehicle_type:',
      payload.vehicle_type,
      typeof payload.vehicle_type
    );
    console.log(
      '- service_package:',
      payload.service_package,
      typeof payload.service_package
    );
    console.log('- nickname:', payload.nickname, typeof payload.nickname);
    console.log('- phone:', payload.phone, typeof payload.phone);
    console.log('- wash_date:', payload.wash_date, typeof payload.wash_date);
    console.log('- wash_time:', payload.wash_time, typeof payload.wash_time);
    console.log(
      '- payment_type:',
      payload.payment_type,
      typeof payload.payment_type
    );

    this.bookingService.createBooking(payload).subscribe({
      next: (response) => {
        console.log('Booking created successfully:', response);

        // If employee is assigned, assign them to the booking
        if (this.form.assigned_employee_id && response.data?.booking_id) {
          this.bookingService
            .assignEmployeeToBooking(
              response.data.booking_id,
              this.form.assigned_employee_id
            )
            .subscribe({
              next: () => {
                console.log('Employee assigned successfully');
                this.submitting = false;
                this.snackBar.open(
                  'Booking created and employee assigned successfully!',
                  'Close',
                  {
                    duration: 3000,
                    horizontalPosition: 'right',
                    verticalPosition: 'top',
                  }
                );
                this.dialogRef.close(true);
              },
              error: (assignError) => {
                console.error('Error assigning employee:', assignError);
                this.submitting = false;
                this.snackBar.open(
                  'Booking created but failed to assign employee: ' +
                    (assignError.message || 'Unknown error'),
                  'Close',
                  {
                    duration: 5000,
                    horizontalPosition: 'right',
                    verticalPosition: 'top',
                  }
                );
                this.dialogRef.close(true);
              },
            });
        } else {
          this.submitting = false;
          this.snackBar.open('Booking created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.submitting = false;
        this.snackBar.open(
          'Failed to create booking: ' + (error.message || 'Unknown error'),
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          }
        );
      },
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
    MatFormFieldModule,
    MatDividerModule,
    MatChipsModule,
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
              Complete booking information and customer details
            </p>
          </div>
        </div>
        <button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Customer Information Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">person</mat-icon>
            <h3>Customer Information</h3>
          </div>
          <div class="info-grid">
            <div
              class="info-item"
              *ngIf="data.booking.firstName && data.booking.lastName"
            >
              <span class="label">First Name</span>
              <span class="value">{{ data.booking.firstName }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.lastName">
              <span class="label">Last Name</span>
              <span class="value">{{ data.booking.lastName }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.nickname">
              <span class="label">Nickname</span>
              <span class="value">{{ data.booking.nickname }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.phone">
              <span class="label">Phone Number</span>
              <span class="value">{{ data.booking.phone }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.additionalPhone">
              <span class="label">Additional Phone</span>
              <span class="value">{{ data.booking.additionalPhone }}</span>
            </div>
          </div>
        </div>

        <!-- Vehicle Information Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">directions_car</mat-icon>
            <h3>Vehicle Information</h3>
          </div>
          <div class="info-grid">
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

        <!-- Service Details Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">local_car_wash</mat-icon>
            <h3>Service Details</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Service Type</span>
              <span class="value">{{
                data.booking.serviceType ||
                  data.booking.serviceName ||
                  'Standard Wash'
              }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.serviceDescription">
              <span class="label">Service Description</span>
              <span class="value">{{ data.booking.serviceDescription }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.serviceDuration">
              <span class="label">Estimated Duration</span>
              <span class="value"
                >{{ data.booking.serviceDuration }} minutes</span
              >
            </div>
            <div class="info-item">
              <span class="label">Price</span>
              <span class="value price"
                >₱{{ data.booking.price | number : '1.2-2' }}</span
              >
            </div>
          </div>
        </div>

        <!-- Schedule Information Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">schedule</mat-icon>
            <h3>Schedule Information</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Wash Date</span>
              <span class="value">{{
                data.booking.date || data.booking.washDate
              }}</span>
            </div>
            <div class="info-item">
              <span class="label">Wash Time</span>
              <span class="value">{{
                formatTimeForUnknownVehicle(
                  data.booking.time || data.booking.washTime || '',
                  data.booking.vehicleType
                )
              }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.dateCreated">
              <span class="label">Booking Created</span>
              <span class="value">{{
                formatDate(data.booking.dateCreated)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Information Section -->
        <div class="info-section" *ngIf="data.booking.paymentType">
          <div class="section-header">
            <mat-icon class="section-icon">payment</mat-icon>
            <h3>Payment Information</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Payment Type</span>
              <span class="value">{{ data.booking.paymentType }}</span>
            </div>
            <div class="info-item" *ngIf="data.booking.onlinePaymentOption">
              <span class="label">Payment Method</span>
              <span class="value">{{ data.booking.onlinePaymentOption }}</span>
            </div>
          </div>
        </div>

        <!-- Assignment Information Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">work</mat-icon>
            <h3>Employee Assignment</h3>
          </div>
          <div class="info-grid">
            <!-- Show assigned employee name if available -->
            <div class="info-item" *ngIf="data.booking.assignedEmployeeName">
              <span class="label">Assigned Employee</span>
              <span class="value">{{ data.booking.assignedEmployeeName }}</span>
            </div>

            <!-- Show employee name from first/last name if available -->
            <div
              class="info-item"
              *ngIf="
                (data.booking.employeeFirstName ||
                  data.booking.employeeLastName) &&
                !data.booking.assignedEmployeeName
              "
            >
              <span class="label">Employee Name</span>
              <span class="value"
                >{{ data.booking.employeeFirstName || '' }}
                {{ data.booking.employeeLastName || '' }}</span
              >
            </div>

            <!-- Show employee position if available -->
            <div class="info-item" *ngIf="data.booking.employeePosition">
              <span class="label">Employee Position</span>
              <span class="value">{{ data.booking.employeePosition }}</span>
            </div>

            <!-- Show assignment status if no employee data is available -->
            <div
              class="info-item"
              *ngIf="
                !data.booking.assignedEmployeeId &&
                !data.booking.assignedEmployeeName &&
                !data.booking.employeeFirstName &&
                !data.booking.employeeLastName
              "
            >
              <span class="label">Assignment Status</span>
              <span class="value no-assignment">No employee assigned yet</span>
            </div>

            <!-- Debug info (remove in production) -->
            <div class="info-item debug-info" *ngIf="false">
              <span class="label">Debug Info</span>
              <span class="value debug-text">
                ID: {{ data.booking.assignedEmployeeId || 'null' }} | Name:
                {{ data.booking.assignedEmployeeName || 'null' }} | First:
                {{ data.booking.employeeFirstName || 'null' }} | Last:
                {{ data.booking.employeeLastName || 'null' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Status Information Section -->
        <div class="info-section">
          <div class="section-header">
            <mat-icon class="section-icon">info</mat-icon>
            <h3>Status Information</h3>
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
                {{ displayStatus(data.booking.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Decline Reason Section (only for rejected bookings) -->
        <div
          class="info-section"
          *ngIf="
            data.booking.status === 'Rejected' && data.booking.rejectionReason
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">cancel</mat-icon>
            <h3>Decline Reason</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <span class="label">Reason for Decline</span>
              <span class="value notes-text rejection-reason">{{
                data.booking.rejectionReason
              }}</span>
            </div>
          </div>
        </div>

        <!-- Cancellation Reason Section (only for cancelled bookings) -->
        <div
          class="info-section"
          *ngIf="
            data.booking.status === 'Cancelled' &&
            getCancellationReason(data.booking)
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">block</mat-icon>
            <h3>Cancellation Reason</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <span class="label">Reason for Cancellation</span>
              <span class="value notes-text cancellation-reason">{{
                getCancellationReason(data.booking)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div
          class="info-section"
          *ngIf="data.booking.notes && getBookingNotes(data.booking)"
        >
          <div class="section-header">
            <mat-icon class="section-icon">notes</mat-icon>
            <h3>Additional Notes</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <span class="label">Customer Notes</span>
              <span class="value notes-text">{{
                getBookingNotes(data.booking)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Employee Feedback Section (if employee feedback exists) -->
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

        <!-- Service Feedback Section (if service feedback exists) -->
        <div
          class="info-section service-feedback-section"
          *ngIf="
            data.booking.status === 'Completed' &&
            (data.booking.serviceRating || data.booking.serviceComment)
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">rate_review</mat-icon>
            <h3>Customer Feedback (Service)</h3>
          </div>
          <div class="info-grid">
            <div class="info-item" *ngIf="data.booking.serviceRating">
              <span class="label">Rating</span>
              <span class="value rating-display">
                <span class="stars">{{
                  getStarDisplay(data.booking.serviceRating || 0)
                }}</span>
                <span class="rating-value"
                  >{{ data.booking.serviceRating }}/5</span
                >
              </span>
            </div>
            <div
              class="info-item notes-item"
              *ngIf="data.booking.serviceComment"
            >
              <span class="label">Comment</span>
              <span class="value notes-text service-feedback-text">{{
                data.booking.serviceComment
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

        <!-- Admin Reply Section (if admin replied to feedback) -->
        <div
          class="info-section"
          *ngIf="
            data.booking.adminComment &&
            data.booking.adminComment.trim().length > 0
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">reply</mat-icon>
            <h3>Admin Reply</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <div
                style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;"
              >
                <span class="label">Reply</span>
                <span
                  class="value"
                  style="font-size: 12px; color: #64748b; font-weight: normal;"
                  *ngIf="data.booking.adminCommentedAt"
                >
                  {{ formatAdminReplyDate(data.booking.adminCommentedAt) }}
                </span>
              </div>
              <span class="value notes-text admin-reply-text">{{
                data.booking.adminComment
              }}</span>
            </div>
          </div>
        </div>

        <!-- Edit Section (only for edit mode) -->
        <div class="info-section" *ngIf="data.mode === 'edit'">
          <div class="section-header">
            <mat-icon class="section-icon">edit</mat-icon>
            <h3>Update Status</h3>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">New Status</span>
              <mat-select [(ngModel)]="editableStatus" class="status-select">
                <mat-option value="Pending">Pending</mat-option>
                <mat-option value="Approved">Approved</mat-option>
                <mat-option value="Rejected">Declined</mat-option>
                <mat-option value="Completed">Completed</mat-option>
              </mat-select>
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
          *ngIf="data.mode === 'edit'"
          (click)="onSave()"
        >
          <mat-icon>save</mat-icon>
          Save Changes
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
        max-height: 90vh;
        display: flex;
        flex-direction: column;
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
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .info-section {
        margin-bottom: 20px;
        padding: 16px;
        background: transparent;
        border-radius: 0;
        border: none;
      }

      .info-section:last-of-type {
        margin-bottom: 0;
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
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .label {
        font-weight: 600;
        color: #475569;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .value {
        color: #1e293b;
        font-size: 14px;
        font-weight: 500;
        width: 100%;
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

      .status-cancelled {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .status-expired {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fcd34d;
      }

      .status-select {
        min-width: 120px;
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

      .rejection-reason {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 12px;
        color: #dc2626;
        font-weight: 500;
      }

      .cancellation-reason {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        padding: 12px;
        color: #c2410c;
        font-weight: 500;
      }

      .admin-reply-text {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 12px;
        color: #0c4a6e;
        font-weight: 500;
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

      .service-feedback-section {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1px solid #bae6fd;
        border-radius: 12px;
        padding: 20px;
        margin-top: 20px;
      }

      .service-feedback-section .section-header h3 {
        color: #0284c7;
      }

      .service-feedback-section .section-icon {
        color: #0284c7;
      }

      .service-feedback-text {
        background: #e0f2fe;
        border: 1px solid #7dd3fc;
        border-radius: 8px;
        padding: 12px;
        color: #0c4a6e;
        font-weight: 500;
      }

      .no-assignment {
        color: #6b7280;
        font-style: italic;
      }

      .debug-info {
        background: #fef3c7 !important;
        border: 1px solid #f59e0b !important;
      }

      .debug-text {
        font-size: 12px !important;
        color: #92400e !important;
        font-family: monospace !important;
      }

      .modal-actions {
        padding: 16px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-shrink: 0;
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .primary-btn:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .modal-container {
          min-width: 100vw;
          max-width: 100vw;
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
          margin: 0;
        }

        .modal-header {
          padding: 16px 20px;
          border-radius: 0;
        }

        .header-content {
          gap: 12px;
        }

        .header-icon {
          padding: 10px;
          border-radius: 10px;
        }

        .header-icon mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .modal-title {
          font-size: 18px;
        }

        .modal-subtitle {
          font-size: 13px;
        }

        .close-button {
          padding: 6px;
        }

        .close-button mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .modal-content {
          padding: 16px 20px;
          max-height: none;
        }

        .info-section {
          margin-bottom: 20px;
          padding: 0;
        }

        .section-header {
          margin-bottom: 12px;
          gap: 10px;
        }

        .section-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .section-header h3 {
          font-size: 15px;
        }

        .info-grid {
          gap: 12px;
        }

        .info-item {
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          min-height: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          color: #1e293b;
          font-weight: 400;
        }

        .modal-actions {
          padding: 16px 20px;
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
          padding: 14px 20px;
          font-size: 15px;
        }

        .secondary-btn {
          background: #e2e8f0;
          color: #475569;
        }

        .notes-item {
          padding: 14px 16px;
        }

        .notes-text {
          font-size: 14px;
          line-height: 1.6;
        }
      }

      @media (max-width: 480px) {
        .modal-header {
          padding: 14px 16px;
        }

        .modal-content {
          padding: 14px 16px;
        }

        .info-item {
          padding: 12px 14px;
        }

        .modal-actions {
          padding: 14px 16px;
        }
      }
    `,
  ],
})
export class BookingDetailsDialogComponent {
  editableStatus:
    | 'Pending'
    | 'Approved'
    | 'Rejected'
    | 'Done'
    | 'Completed'
    | 'Cancelled'
    | 'Expired';
  ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  constructor(
    public dialogRef: MatDialogRef<BookingDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { booking: CarWashBooking; mode: 'view' | 'edit' }
  ) {
    this.editableStatus = data.booking.status;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({
      id: this.data.booking.id,
      status: this.editableStatus,
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatTimeForUnknownVehicle(timeString: string, vehicleType: string): string {
    // If vehicle type is "Unknown", format time as 1:00pm or 1:00am
    if (vehicleType === 'Unknown') {
      // Check if it's currently morning or afternoon based on current time
      const now = new Date();
      const isMorning = now.getHours() < 12;
      return isMorning ? '1:00am' : '1:00pm';
    }

    // For other vehicle types, format the time to 12-hour format with AM/PM
    if (timeString) {
      return this.formatTimeTo12Hour(timeString);
    }

    return '';
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
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');

        return `${displayHours}:${displayMinutes}${period}`;
      }
    } catch (error) {
      console.warn('Error formatting time:', error);
    }

    return timeString; // Return original if formatting fails
  }

  formatTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const displayMinutes = minutes.toString().padStart(2, '0');

      return `${displayHours}:${displayMinutes}${period}`;
    } catch (error) {
      return '';
    }
  }

  formatAdminReplyDate(dateTimeString: string): string {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';

      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = this.formatTime(dateTimeString);

      return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
    } catch (error) {
      return '';
    }
  }

  // Display-friendly status mapping for this dialog
  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    if (s.toLowerCase() === 'approved') return 'Ongoing';
    return s;
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

  getCancellationReason(booking: CarWashBooking): string | null {
    const notes = (booking?.notes || '').toString();
    if (!notes.trim()) {
      return null;
    }

    // Check for "Customer reason:" prefix (used when customer cancels)
    if (notes.includes('Customer reason:')) {
      const reason = notes.split('Customer reason:')[1]?.trim();
      if (reason) {
        // Remove any additional notes that might be after the reason (separated by |)
        const cleanReason = reason.split('|')[0]?.trim();
        return cleanReason || reason;
      }
    }

    // If status is cancelled but no specific reason format found, return the entire notes
    // (in case it was cancelled without the standard format)
    if (booking.status === 'Cancelled' && notes.trim()) {
      return notes.trim();
    }

    return null;
  }

  getBookingNotes(booking: CarWashBooking): string | null {
    const notes = (booking?.notes || '').toString();
    if (!notes.trim()) {
      return null;
    }

    // If booking is cancelled and has cancellation reason, exclude it from notes
    if (booking.status === 'Cancelled' && notes.includes('Customer reason:')) {
      const beforeReason = notes.split('Customer reason:')[0]?.trim();
      if (beforeReason) {
        // Remove trailing separator if present
        return beforeReason.replace(/\s*\|\s*$/, '').trim();
      }
      return null; // If only cancellation reason exists, don't show notes section
    }

    // If booking is rejected and has rejection reason, exclude it from notes
    if (booking.status === 'Rejected' && notes.includes('Rejection reason:')) {
      const beforeReason = notes.split('Rejection reason:')[0]?.trim();
      if (beforeReason) {
        // Remove trailing separator if present
        return beforeReason.replace(/\s*\|\s*$/, '').trim();
      }
      return null; // If only rejection reason exists, don't show notes section
    }

    return notes.trim();
  }
}

@Component({
  selector: 'app-employee-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">Assign Employee to Booking</h2>
    <div mat-dialog-content class="dialog-content">
      <div class="header-block">
        <div class="avatar">
          {{ (data.booking.customerName || 'C')[0] | uppercase }}
        </div>
        <div class="title-area">
          <div class="customer-name">{{ data.booking.customerName }}</div>
          <div class="subtitle">
            {{ data.booking.serviceType || 'Standard Wash' }}
          </div>
        </div>
        <mat-chip-set class="status-chip">
          <mat-chip class="status-pending" appearance="outlined">
            <mat-icon inline>hourglass_empty</mat-icon>
            Pending
          </mat-chip>
        </mat-chip-set>
      </div>

      <mat-divider></mat-divider>

      <div class="details-grid">
        <div class="detail">
          <mat-icon>calendar_today</mat-icon>
          <div class="detail-text">
            <div class="label">Date</div>
            <div class="value">{{ data.booking.date }}</div>
          </div>
        </div>
        <div class="detail">
          <mat-icon>access_time</mat-icon>
          <div class="detail-text">
            <div class="label">Time</div>
            <div class="value">
              {{
                formatBookingTime(data.booking.time || data.booking.washTime)
              }}
            </div>
          </div>
        </div>
        <div class="detail">
          <mat-icon>directions_car</mat-icon>
          <div class="detail-text">
            <div class="label">Vehicle</div>
            <div class="value">{{ data.booking.vehicleType }}</div>
          </div>
        </div>
        <div class="detail">
          <span class="peso-icon">₱</span>
          <div class="detail-text">
            <div class="label">Price</div>
            <div class="value">
              ₱{{ data.booking.price | number : '1.2-2' }}
            </div>
          </div>
        </div>
      </div>

      <div class="assignment-section">
        <mat-divider></mat-divider>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Select Employee *</mat-label>
            <mat-select [(ngModel)]="selectedEmployeeId" required>
              <mat-option
                *ngFor="let employee of data.employees"
                [value]="employee.id"
              >
                {{ employee.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="!selectedEmployeeId"
              >Employee selection is required</mat-error
            >
          </mat-form-field>
        </div>
      </div>
    </div>
    <div mat-dialog-actions align="end" class="actions">
      <button mat-button (click)="onClose()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!selectedEmployeeId"
        (click)="onAssign()"
      >
        Assign & Approve
      </button>
    </div>
  `,
  styles: [
    `
      .dialog-title {
        margin: 0;
      }
      .header-block {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #1976d2;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
      }
      .title-area {
        display: flex;
        flex-direction: column;
      }
      .customer-name {
        font-size: 16px;
        font-weight: 600;
      }
      .subtitle {
        font-size: 13px;
        color: #666;
      }
      .status-chip :where(mat-chip) {
        font-weight: 600;
      }
      .status-pending {
        color: #ffa000;
        border-color: #ffa000;
      }

      .details-grid {
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .detail {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0;
      }
      .detail mat-icon {
        color: #666;
      }
      .detail .peso-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.12);
        color: #1d4ed8;
        font-weight: 600;
        font-size: 14px;
      }
      .detail .label {
        font-size: 12px;
        color: #777;
      }
      .detail .value {
        font-size: 14px;
        font-weight: 500;
      }

      .assignment-section {
        margin-top: 12px;
      }
      .form-row {
        margin-top: 12px;
      }
      .form-row .full {
        width: 100%;
      }

      .actions {
        padding-top: 8px;
      }
    `,
  ],
})
export class EmployeeAssignmentDialogComponent {
  selectedEmployeeId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<EmployeeAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      booking: any;
      employees: Employee[];
    }
  ) {}

  formatBookingTime(time?: string | null): string {
    if (!time) {
      return 'Not set';
    }

    const trimmed = String(time).trim();
    if (!trimmed) {
      return 'Not set';
    }

    const parts = trimmed.split(':');
    if (parts.length < 2) {
      return trimmed;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return trimmed;
    }

    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes}${period}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onAssign(): void {
    if (this.selectedEmployeeId) {
      this.dialogRef.close({
        employeeId: this.selectedEmployeeId,
      });
    }
  }
}
