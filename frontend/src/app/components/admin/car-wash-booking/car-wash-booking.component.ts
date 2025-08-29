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
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';
import { environment } from '../../../../environments/environment';
import { Employee } from '../../../models/booking.model';

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
  notes?: string;
  // Additional fields for comprehensive details
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
      <h2 mat-dialog-title>Reject Booking</h2>
      <mat-dialog-content>
        <p>Please provide a reason for rejecting this booking:</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rejection Reason</mat-label>
          <textarea
            matInput
            [(ngModel)]="rejectionReason"
            placeholder="Enter the reason for rejection..."
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
          Reject Booking
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
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatDialogModule,
    MatInputModule,
  ],
  templateUrl: './car-wash-booking.component.html',
  styleUrl: './car-wash-booking.component.css',
})
export class CarWashBookingComponent implements OnInit {
  bookings: CarWashBooking[] = [];
  selectedStatus: string = 'All';
  employees: Employee[] = [];
  loading: boolean = false;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadEmployees();
  }

  addBooking(): void {
    // Implement add booking functionality
  }

  addSlotBooking(): void {
    // Implement add slot booking functionality
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
        const prev = booking.status;
        booking.status = 'Rejected';
        booking.rejectionReason = reason;

        this.bookingService
          .updateBookingStatus(booking.id, 'Rejected', reason)
          .subscribe({
            next: () => this.showNotification('Booking rejected successfully'),
            error: (err) => {
              booking.status = prev;
              delete booking.rejectionReason;
              this.showNotification(err.message || 'Failed to reject booking');
            },
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

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.map((b: any, idx: number) => {
          const booking = {
            id: Number(b.id ?? idx + 1),
            customerName: this.resolveCustomerName(b.customerName, b.nickname),
            vehicleType: b.vehicleType ?? 'Unknown',
            date: b.washDate ?? '',
            time: b.washTime ?? '',
            status: (b.status ?? 'Pending') as
              | 'Pending'
              | 'Approved'
              | 'Rejected'
              | 'Completed',
            serviceType: b.serviceName ?? 'Standard Wash',
            price: b.price ? Number(b.price) : undefined,
            imageUrl: 'assets/images/profile-placeholder.jpg',
            notes: b.notes ?? undefined,
            // Additional comprehensive details
            firstName: b.firstName ?? b.first_name,
            lastName: b.lastName ?? b.last_name,
            nickname: b.nickname,
            phone: b.phone,
            additionalPhone: b.additionalPhone ?? b.additional_phone,
            paymentType: b.paymentType ?? b.payment_type,
            onlinePaymentOption:
              b.onlinePaymentOption ?? b.online_payment_option,
            serviceDescription: b.serviceDescription ?? b.service_description,
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
          };

          return booking;
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load bookings';
        this.loading = false;
        this.showNotification(err.message || 'Failed to load bookings');
      },
    });
  }

  private resolveCustomerName(dbFullName?: string, nickname?: string): string {
    const full = (dbFullName || '').trim();
    if (full.length > 0) return full;
    const nick = (nickname || '').trim();
    return nick.length > 0 ? nick : 'Customer';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  private openBookingDialog(booking: CarWashBooking, mode: 'view' | 'edit') {
    const dialogRef = this.dialog.open(BookingDetailsDialogComponent, {
      width: '520px',
      data: { booking: { ...booking }, mode },
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
          this.employees = response.payload.employees.map((employee: any) => ({
            id: employee.id,
            employeeId: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            phone: employee.phone || 'N/A',
            role: employee.position || 'Employee',
            status: 'Active',
            registrationDate: this.formatDate(employee.created_at),
          }));
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
            <div class="info-item">
              <span class="label">Full Name</span>
              <span class="value">{{ data.booking.customerName }}</span>
            </div>
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
              <span class="value price">{{
                data.booking.price | currency
              }}</span>
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
                data.booking.time || data.booking.washTime
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

            <!-- Show employee ID if available -->
            <div class="info-item" *ngIf="data.booking.assignedEmployeeId">
              <span class="label">Employee ID</span>
              <span class="value">{{ data.booking.assignedEmployeeId }}</span>
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
                {{ data.booking.status }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Booking ID</span>
              <span class="value">{{ data.booking.id }}</span>
            </div>
          </div>
        </div>

        <!-- Rejection Reason Section (only for rejected bookings) -->
        <div
          class="info-section"
          *ngIf="
            data.booking.status === 'Rejected' && data.booking.rejectionReason
          "
        >
          <div class="section-header">
            <mat-icon class="section-icon">cancel</mat-icon>
            <h3>Rejection Reason</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <span class="label">Reason for Rejection</span>
              <span class="value notes-text rejection-reason">{{
                data.booking.rejectionReason
              }}</span>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="info-section" *ngIf="data.booking.notes">
          <div class="section-header">
            <mat-icon class="section-icon">notes</mat-icon>
            <h3>Additional Notes</h3>
          </div>
          <div class="info-grid">
            <div class="info-item notes-item">
              <span class="label">Customer Notes</span>
              <span class="value notes-text">{{ data.booking.notes }}</span>
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
                <mat-option value="Rejected">Rejected</mat-option>
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .primary-btn:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
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
  editableStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed';

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
            <div class="value">{{ data.booking.time }}</div>
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
          <mat-icon>attach_money</mat-icon>
          <div class="detail-text">
            <div class="label">Price</div>
            <div class="value">{{ data.booking.price | currency }}</div>
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
                {{ employee.name }} - {{ employee.role }}
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
