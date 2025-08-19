import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BookingService } from '../../../services/booking.service';

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
    MatFormFieldModule,
    HttpClientModule,
    MatDialogModule,
  ],
  templateUrl: './car-wash-booking.component.html',
  styleUrl: './car-wash-booking.component.css',
})
export class CarWashBookingComponent implements OnInit {
  bookings: CarWashBooking[] = [];

  selectedStatus: string = 'All';

  constructor(
    private snackBar: MatSnackBar,
    private bookingService: BookingService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  addBooking(): void {
    // Implement add booking functionality
  }

  addSlotBooking(): void {
    // Implement add slot booking functionality
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

  private loadBookings(): void {
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.map((b: any, idx: number) => ({
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
        }));
      },
      error: (err) => {
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
    <h2 mat-dialog-title class="dialog-title">
      {{ data.mode === 'view' ? 'Booking Details' : 'Edit Booking' }}
    </h2>
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
          <mat-chip
            [ngClass]="{
              'status-pending': data.booking.status === 'Pending',
              'status-approved': data.booking.status === 'Approved',
              'status-rejected': data.booking.status === 'Rejected',
              'status-completed': data.booking.status === 'Completed'
            }"
            appearance="outlined"
          >
            <mat-icon inline>{{
              data.booking.status === 'Pending'
                ? 'hourglass_empty'
                : data.booking.status === 'Approved'
                ? 'check_circle'
                : data.booking.status === 'Rejected'
                ? 'cancel'
                : 'done_all'
            }}</mat-icon>
            {{ data.booking.status }}
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

      <div class="edit-section" *ngIf="data.mode === 'edit'">
        <mat-divider></mat-divider>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="editableStatus">
              <mat-option value="Pending">Pending</mat-option>
              <mat-option value="Approved">Approved</mat-option>
              <mat-option value="Rejected">Rejected</mat-option>
              <mat-option value="Completed">Completed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
    </div>
    <div mat-dialog-actions align="end" class="actions">
      <button mat-button (click)="onClose()">Close</button>
      <button
        mat-raised-button
        color="primary"
        *ngIf="data.mode === 'edit'"
        (click)="onSave()"
      >
        Save
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
      .status-approved {
        color: #4caf50;
        border-color: #4caf50;
      }
      .status-rejected {
        color: #f44336;
        border-color: #f44336;
      }
      .status-completed {
        color: #9c27b0;
        border-color: #9c27b0;
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
}
