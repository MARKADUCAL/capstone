import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface Booking {
  id: number;
  customerName: string;
  service: string;
  status: string;
  amount: number;
  date: string;
}

interface DateBookingsDialogData {
  date: Date;
  bookings: Booking[];
  formattedDate: string;
}

@Component({
  selector: 'app-date-bookings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <div class="dialog-container">
      <!-- Header Section -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="title-section">
            <mat-icon class="header-icon">calendar_today</mat-icon>
            <div class="title-group">
              <h2 mat-dialog-title>Bookings for {{ data.formattedDate }}</h2>
              <p class="subtitle">{{ data.bookings.length }} booking(s)</p>
            </div>
          </div>
          <button class="close-button" (click)="onClose()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-dialog-content>
        <div class="bookings-list" *ngIf="data.bookings.length > 0">
          <div class="booking-card" *ngFor="let booking of data.bookings">
            <div class="booking-card-header">
              <div class="customer-info">
                <div class="customer-avatar">
                  {{ getInitials(booking.customerName) }}
                </div>
                <div class="customer-details">
                  <h4 class="customer-name">{{ booking.customerName }}</h4>
                  <p class="service-name">
                    <mat-icon>build</mat-icon>
                    {{ booking.service }}
                  </p>
                </div>
              </div>
              <div class="booking-meta">
              <span
                class="status-badge"
                [class]="getStatusClass(booking.status)"
              >
                {{ displayStatus(booking.status) }}
              </span>
                <p class="booking-amount">
                  {{ formatCurrency(booking.amount) }}
                </p>
              </div>
            </div>
            <div class="booking-card-actions">
              <button
                mat-raised-button
                color="primary"
                class="view-btn"
                (click)="viewBooking(booking.id)"
              >
                <mat-icon>visibility</mat-icon>
                View Details
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="data.bookings.length === 0">
          <mat-icon>event_busy</mat-icon>
          <h3>No Bookings</h3>
          <p>There are no bookings scheduled for this date.</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
      }

      .dialog-header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 20px 24px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .title-section {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .header-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .title-group h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .subtitle {
        margin: 4px 0 0 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .close-button mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      mat-dialog-content {
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
        flex: 1;
      }

      .bookings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .booking-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s ease;
      }

      .booking-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .booking-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 16px;
      }

      .customer-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .customer-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
        flex-shrink: 0;
      }

      .customer-details {
        flex: 1;
        min-width: 0;
      }

      .customer-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .service-name {
        margin: 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .service-name mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .booking-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      .status-badge {
        text-transform: capitalize;
      }

      .status-badge.pending {
        background-color: #fff7ed;
        color: #d97706;
        border: 1px solid #fde68a;
      }

      .status-badge.completed {
        background-color: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }

      .status-badge.approved {
        background-color: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      .status-badge.rejected,
      .status-badge.declined {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .status-badge.cancelled,
      .status-badge.canceled {
        background-color: #f3f4f6;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }

      .status-badge.done {
        background-color: #f0f9ff;
        color: #0284c7;
        border: 1px solid #bae6fd;
      }

      .booking-amount {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #059669;
      }

      .booking-card-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }

      .view-btn {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .view-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        color: rgba(0, 0, 0, 0.45);
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.65);
      }

      .empty-state p {
        margin: 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.45);
      }

      mat-dialog-actions {
        padding: 16px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        margin: 0;
      }

      /* Mobile Styles */
      @media (max-width: 768px) {
        .dialog-container {
          max-height: 100vh;
          height: 100vh;
          border-radius: 0;
        }

        .dialog-header {
          padding: 16px 20px;
        }

        .title-group h2 {
          font-size: 18px;
        }

        mat-dialog-content {
          padding: 16px 20px;
          max-height: calc(100vh - 200px);
        }

        .booking-card {
          padding: 14px;
        }

        .customer-avatar {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }

        .customer-name {
          font-size: 15px;
        }

        .booking-card-header {
          flex-direction: column;
          align-items: stretch;
        }

        .booking-meta {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .view-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class DateBookingsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DateBookingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DateBookingsDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  viewBooking(bookingId: number): void {
    this.dialogRef.close({ bookingId });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatCurrency(amount: number): string {
    return (
      '₱' +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  }

  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    return s;
  }

  getStatusClass(status: string): string {
    if (!status) return 'pending';
    const normalized = status.toLowerCase().trim().replace(/\s+/g, '-');
    
    // Handle all possible status values
    if (normalized === 'rejected' || normalized === 'declined') {
      return 'rejected';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'cancelled';
    }
    
    return normalized;
  }
}
