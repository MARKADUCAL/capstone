import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
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
      width: '420px',
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
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'view' ? 'View Booking' : 'Edit Booking' }}
    </h2>
    <div mat-dialog-content class="dialog-content">
      <div class="row">
        <strong>Customer:</strong> {{ data.booking.customerName }}
      </div>
      <div class="row">
        <strong>Vehicle:</strong> {{ data.booking.vehicleType }}
      </div>
      <div class="row">
        <strong>Service:</strong>
        {{ data.booking.serviceType || 'Standard Wash' }}
      </div>
      <div class="row">
        <strong>Price:</strong> {{ data.booking.price | currency }}
      </div>
      <div class="row"><strong>Date:</strong> {{ data.booking.date }}</div>
      <div class="row"><strong>Time:</strong> {{ data.booking.time }}</div>

      <div class="row" *ngIf="data.mode === 'view'">
        <strong>Status:</strong> {{ data.booking.status }}
      </div>

      <div class="row" *ngIf="data.mode === 'edit'">
        <strong>Status:</strong>
        <mat-select [(ngModel)]="editableStatus">
          <mat-option value="Pending">Pending</mat-option>
          <mat-option value="Approved">Approved</mat-option>
          <mat-option value="Rejected">Rejected</mat-option>
          <mat-option value="Completed">Completed</mat-option>
        </mat-select>
      </div>
    </div>
    <div mat-dialog-actions align="end">
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
      .dialog-content {
        display: grid;
        gap: 10px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
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
