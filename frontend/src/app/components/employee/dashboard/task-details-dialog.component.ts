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

interface TaskDetails {
  id: number;
  customerName: string;
  service: string;
  time: string;
  date: string;
  status?: string;
  customerRating?: number;
  customerRatingComment?: string;
  feedbackCreatedAt?: string;
}

@Component({
  selector: 'app-task-details-dialog',
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
            <mat-icon class="header-icon">assignment</mat-icon>
            <h2 mat-dialog-title>Task Details</h2>
          </div>
        </div>
      </div>

      <mat-dialog-content>
        <div class="task-details">
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

          <!-- Schedule Section -->
          <div class="detail-section">
            <div class="section-header">
              <mat-icon class="section-icon">schedule</mat-icon>
              <h3 class="section-title">Schedule Information</h3>
            </div>
            <div class="detail-row">
              <span class="label">Scheduled Date:</span>
              <span class="value">{{ data.date }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Scheduled Time:</span>
              <span class="value time-value">{{ data.time }}</span>
            </div>
          </div>

          <!-- Customer Feedback Section (if feedback exists for completed bookings) -->
          <div
            class="detail-section"
            *ngIf="
              data.status === 'Completed' && data.customerRating !== undefined
            "
          >
            <div class="section-header">
              <mat-icon class="section-icon">star</mat-icon>
              <h3 class="section-title">Customer Feedback</h3>
            </div>
            <div class="detail-row">
              <span class="label">Rating:</span>
              <span class="value rating-display">
                <span class="stars">{{
                  getStarDisplay(data.customerRating || 0)
                }}</span>
                <span class="rating-value">{{ data.customerRating }}/5</span>
              </span>
            </div>
            <div
              class="detail-row feedback-comment-row"
              *ngIf="data.customerRatingComment"
            >
              <span class="label">Comment:</span>
              <span class="value feedback-comment">{{
                data.customerRatingComment
              }}</span>
            </div>
            <div class="detail-row" *ngIf="data.feedbackCreatedAt">
              <span class="label">Submitted On:</span>
              <span class="value">{{
                formatDate(data.feedbackCreatedAt)
              }}</span>
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
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        padding: 24px;
        color: white;
      }

      .header-content {
        display: flex;
        justify-content: flex-start;
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

      .task-details {
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
        color: #1976d2;
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
        color: #1976d2;
        font-size: 16px;
      }

      .service-name {
        font-weight: 600;
        color: #2c3e50;
        font-size: 15px;
      }

      .time-value {
        font-weight: 600;
        color: #666;
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

      .feedback-comment-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .feedback-comment {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 100%;
        line-height: 1.5;
        background: #fefce8;
        border: 1px solid #fde047;
        border-radius: 8px;
        padding: 12px;
        color: #713f12;
        font-weight: 500;
        text-align: left;
      }

      /* Status Badge Styles */
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
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
      }

      .close-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(25, 118, 210, 0.4);
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
export class TaskDetailsDialog {
  constructor(
    public dialogRef: MatDialogRef<TaskDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDetails
  ) {}

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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  }
}
