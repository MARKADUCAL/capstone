import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [ngClass]="type">
      <div *ngIf="type === 'card'" class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>

      <div *ngIf="type === 'table'" class="skeleton-table">
        <div class="skeleton-row" *ngFor="let row of [1, 2, 3, 4, 5]">
          <div class="skeleton-cell" *ngFor="let cell of [1, 2, 3, 4]"></div>
        </div>
      </div>

      <div *ngIf="type === 'list'" class="skeleton-list">
        <div class="skeleton-list-item" *ngFor="let item of [1, 2, 3, 4, 5]">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      </div>

      <div *ngIf="type === 'text'" class="skeleton-text">
        <div class="skeleton-line" *ngFor="let line of [1, 2, 3]"></div>
      </div>

      <div *ngIf="type === 'dashboard'" class="skeleton-dashboard">
        <div class="skeleton-stats">
          <div class="skeleton-stat-card" *ngFor="let stat of [1, 2, 3, 4]">
            <div class="skeleton-stat-value"></div>
            <div class="skeleton-stat-label"></div>
          </div>
        </div>
        <div class="skeleton-chart"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .skeleton-container {
        width: 100%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .skeleton-card {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .skeleton-header {
        height: 24px;
        background: #e5e7eb;
        border-radius: 4px;
        margin-bottom: 12px;
        width: 60%;
      }

      .skeleton-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-line {
        height: 16px;
        background: #e5e7eb;
        border-radius: 4px;
        width: 100%;
      }

      .skeleton-line.short {
        width: 70%;
      }

      .skeleton-table {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 16px;
      }

      .skeleton-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }

      .skeleton-cell {
        flex: 1;
        height: 40px;
        background: #e5e7eb;
        border-radius: 4px;
      }

      .skeleton-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-list-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: #f3f4f6;
        border-radius: 8px;
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #e5e7eb;
        flex-shrink: 0;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        justify-content: center;
      }

      .skeleton-text {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
      }

      .skeleton-dashboard {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .skeleton-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .skeleton-stat-card {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-stat-value {
        height: 32px;
        background: #e5e7eb;
        border-radius: 4px;
        width: 60%;
      }

      .skeleton-stat-label {
        height: 16px;
        background: #e5e7eb;
        border-radius: 4px;
        width: 80%;
      }

      .skeleton-chart {
        height: 300px;
        background: #f3f4f6;
        border-radius: 8px;
      }
    `,
  ],
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'table' | 'list' | 'text' | 'dashboard' = 'card';
}
