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

interface BookingDetails {
  id: number;
  customerName: string;
  service: string;
  status: string;
  amount: number;
  date: string;
  // Status-specific fields
  assignedEmployeeName?: string;
  assigned_employee_name?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  cancellationReason?: string;
  cancellation_reason?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  customerRating?: number;
  customerRatingComment?: string;
  customer_rating?: number;
  customer_rating_comment?: string;
  feedback_comment?: string;
  assignedBy?: string;
  assigned_by?: string;
  admin_name?: string;
}

@Component({
  selector: 'app-booking-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-container">
      <!-- Header Section -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="title-section">
            <mat-icon class="header-icon">receipt_long</mat-icon>
            <h2 mat-dialog-title>Booking Details</h2>
          </div>
        </div>
      </div>

      <mat-dialog-content>
        <div class="booking-details">
          <!-- Customer Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">person</mat-icon>
              <h3 class="section-title">Customer Information</h3>
            </div>
            <div class="detail-row">
              <span class="label">Customer Name:</span>
              <span class="value customer-name">{{ data.customerName }}</span>
            </div>
          </div>

          <!-- Service Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">local_car_wash</mat-icon>
              <h3 class="section-title">Service Details</h3>
            </div>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value service-name">{{ data.service }}</span>
            </div>
          </div>

          <!-- Status Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">info</mat-icon>
              <h3 class="section-title">Booking Status</h3>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">
                <span
                  class="status-badge"
                  [class]="data.status.toLowerCase().replace(' ', '-')"
                >
                  <mat-icon class="status-icon">{{
                    getStatusIcon(data.status)
                  }}</mat-icon>
                  {{ displayStatus(data.status) }}
                </span>
              </span>
            </div>
            <!-- Ongoing: Show assigned employee -->
            <div
              class="detail-row"
              *ngIf="isOngoingStatus() && getAssignedEmployeeName()"
            >
              <span class="label">Assigned Employee:</span>
              <span class="value employee-name">{{
                getAssignedEmployeeName()
              }}</span>
            </div>
            <!-- Cancelled: Show cancellation reason -->
            <div
              class="detail-row"
              *ngIf="isCancelledStatus() && getCancellationReason()"
            >
              <span class="label">Cancellation Reason:</span>
              <span class="value reason-text">{{ getCancellationReason() }}</span>
            </div>
            <!-- Declined/Rejected: Show rejection reason -->
            <div
              class="detail-row"
              *ngIf="isDeclinedStatus() && getRejectionReason()"
            >
              <span class="label">Decline Reason:</span>
              <span class="value reason-text">{{ getRejectionReason() }}</span>
            </div>
            <!-- Completed: Show assigned employee and feedback -->
            <div
              class="detail-row"
              *ngIf="isCompletedStatus() && getAssignedEmployeeName()"
            >
              <span class="label">Assigned Employee:</span>
              <span class="value employee-name">{{
                getAssignedEmployeeName()
              }}</span>
            </div>
            <div
              class="detail-row"
              *ngIf="isCompletedStatus() && getAssignedBy()"
            >
              <span class="label">Assigned By:</span>
              <span class="value admin-name">{{ getAssignedBy() }}</span>
            </div>
          </div>

          <!-- Customer Feedback Section (for Completed bookings) -->
          <div
            class="detail-section"
            *ngIf="
              isCompletedStatus() &&
              (getCustomerRating() || getCustomerFeedback())
            "
          >
            <div class="section-header">
              <mat-icon class="section-icon">star</mat-icon>
              <h3 class="section-title">Customer Feedback</h3>
            </div>
            <div class="detail-row" *ngIf="getCustomerRating()">
              <span class="label">Rating:</span>
              <span class="value rating-value">
                <span class="rating-stars">{{ getRatingStars() }}</span>
                <span class="rating-number">({{ getCustomerRating() }}/5)</span>
              </span>
            </div>
            <div
              class="detail-row feedback-row"
              *ngIf="getCustomerFeedback()"
            >
              <span class="label">Feedback:</span>
              <span class="value feedback-text">{{ getCustomerFeedback() }}</span>
            </div>
          </div>

          <!-- Financial Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">attach_money</mat-icon>
              <h3 class="section-title">Financial Information</h3>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value amount">{{
                formatCurrency(data.amount)
              }}</span>
            </div>
          </div>

          <!-- Date Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">event</mat-icon>
              <h3 class="section-title">Schedule Information</h3>
            </div>
            <div class="detail-row">
              <span class="label">Booking Date:</span>
              <span class="value date-value">{{ formatDate(data.date) }}</span>
            </div>
            <div class="detail-row" *ngIf="formatTime(data.date)">
              <span class="label">Booking Time:</span>
              <span class="value date-value">{{ formatTime(data.date) }}</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button
          mat-raised-button
          color="primary"
          mat-dialog-close
          class="close-btn"
        >
          <mat-icon>close</mat-icon>
          Close
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        padding: 0;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      /* Header Styles */
      .dialog-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 24px;
        color: white;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .title-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: rgba(255, 255, 255, 0.9);
      }

      h2[mat-dialog-title] {
        margin: 0;
        color: white;
        font-size: 24px;
        font-weight: 600;
      }

      /* Content Styles */
      mat-dialog-content {
        padding: 32px;
        background: #fafafa;
      }

      .booking-details {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Section Styles */
      .detail-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border: 1px solid #e0e0e0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f0f0f0;
      }

      .section-icon {
        color: #667eea;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .section-title {
        margin: 0;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
      }

      .label {
        font-weight: 600;
        color: #666;
        min-width: 120px;
        font-size: 14px;
      }

      .value {
        color: #2c3e50;
        font-weight: 500;
        font-size: 14px;
        text-align: right;
        flex: 1;
      }

      .customer-name {
        font-weight: 700;
        color: #667eea;
        font-size: 16px;
      }

      .service-name {
        font-weight: 600;
        color: #2c3e50;
        font-size: 15px;
      }

      .date-value {
        font-weight: 600;
        color: #666;
      }

      .value.amount {
        font-weight: 700;
        color: #4caf50;
        font-size: 20px;
      }

      /* Status Badge Styles */
      .status-badge {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .status-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .status-badge.pending {
        background: linear-gradient(135deg, #ff9800, #ff5722);
        color: white;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      }

      .status-badge.completed {
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      }

      .status-badge.in-progress {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      }

      .status-badge.cancelled {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      }

      .status-badge.ongoing,
      .status-badge.approved {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      }

      .status-badge.rejected,
      .status-badge.declined {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      }

      .employee-name {
        font-weight: 600;
        color: #2196f3;
      }

      .admin-name {
        font-weight: 600;
        color: #667eea;
      }

      .reason-text {
        color: #d32f2f;
        font-style: italic;
        text-align: left;
        word-break: break-word;
      }

      .rating-value {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rating-stars {
        color: #ffc107;
        font-size: 18px;
        letter-spacing: 2px;
      }

      .rating-number {
        color: #666;
        font-size: 14px;
      }

      .feedback-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .feedback-text {
        text-align: left;
        color: #2c3e50;
        font-style: italic;
        line-height: 1.5;
        word-break: break-word;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
        border-left: 3px solid #667eea;
      }

      /* Actions Styles */
      mat-dialog-actions {
        padding: 24px 32px;
        margin: 0;
        background: white;
        border-top: 1px solid #e0e0e0;
      }

      .close-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .close-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }

      /* Responsive Design */
      @media (max-width: 600px) {
        .header-content {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }

        .detail-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .label {
          min-width: auto;
        }

        .value {
          text-align: left;
        }

        mat-dialog-content {
          padding: 20px;
        }

        .detail-section {
          padding: 16px;
        }
      }
    `,
  ],
})
export class BookingDetailsDialog {
  constructor(
    public dialogRef: MatDialogRef<BookingDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: BookingDetails
  ) {}

  formatCurrency(amount: number): string {
    return (
      '₱' +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString === 'Unknown Date') {
      return 'Unknown Date';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(dateString: string): string | null {
    if (!dateString || dateString === 'Unknown Date') {
      return null;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'in progress':
      case 'approved':
      case 'ongoing':
        return 'play_arrow';
      case 'cancelled':
        return 'cancel';
      case 'rejected':
      case 'declined':
        return 'cancel';
      default:
        return 'info';
    }
  }

  isOngoingStatus(): boolean {
    const status = (this.data.status || '').toLowerCase();
    return status === 'approved' || status === 'ongoing';
  }

  isCancelledStatus(): boolean {
    return (this.data.status || '').toLowerCase() === 'cancelled';
  }

  isDeclinedStatus(): boolean {
    const status = (this.data.status || '').toLowerCase();
    return status === 'rejected' || status === 'declined';
  }

  isCompletedStatus(): boolean {
    return (this.data.status || '').toLowerCase() === 'completed';
  }

  displayStatus(status: string): string {
    const s = (status || '').toString();
    if (s.toLowerCase() === 'rejected') return 'Declined';
    if (s.toLowerCase() === 'approved') return 'Ongoing';
    return s;
  }

  getAssignedEmployeeName(): string | null {
    if (this.data.assignedEmployeeName) {
      return this.data.assignedEmployeeName;
    }
    if (this.data.assigned_employee_name) {
      return this.data.assigned_employee_name;
    }
    if (
      this.data.employee_first_name &&
      this.data.employee_last_name
    ) {
      return `${this.data.employee_first_name} ${this.data.employee_last_name}`;
    }
    return null;
  }

  getCancellationReason(): string | null {
    return (
      this.data.cancellationReason ||
      this.data.cancellation_reason ||
      null
    );
  }

  getRejectionReason(): string | null {
    return (
      this.data.rejectionReason ||
      this.data.rejection_reason ||
      null
    );
  }

  getCustomerRating(): number | null {
    return (
      this.data.customerRating ||
      this.data.customer_rating ||
      null
    );
  }

  getCustomerFeedback(): string | null {
    return (
      this.data.customerRatingComment ||
      this.data.customer_rating_comment ||
      this.data.feedback_comment ||
      null
    );
  }

  getAssignedBy(): string | null {
    return (
      this.data.assignedBy ||
      this.data.assigned_by ||
      this.data.admin_name ||
      null
    );
  }

  getRatingStars(): string {
    const rating = this.getCustomerRating();
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar && fullStars < 5) {
      stars += '½';
    }
    return stars;
  }
}
