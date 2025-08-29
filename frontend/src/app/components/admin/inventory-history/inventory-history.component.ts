import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';

interface InventoryHistoryItem {
  id: number;
  action_type: string;
  item_name: string;
  quantity: number;
  user_name: string;
  action_date: string;
  notes?: string;
  previous_stock?: number;
  new_stock?: number;
}

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Inventory History</h2>
        <p class="subtitle">
          Track all actions performed in the inventory system
        </p>
      </div>

      <!-- Loading state -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Loading history...</p>
      </div>

      <!-- Error state -->
      <div class="error-container" *ngIf="error && !loading">
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadHistory()">Retry</button>
      </div>

      <!-- History list -->
      <div class="history-list" *ngIf="!loading && !error">
        <div class="history-card" *ngFor="let item of historyItems">
          <div class="history-header">
            <h3>{{ item.item_name }}</h3>
            <span
              class="action-badge"
              [class]="'action-' + item.action_type.toLowerCase()"
            >
              {{ item.action_type | titlecase }}
            </span>
          </div>

          <div class="history-details">
            <p><strong>User:</strong> {{ item.user_name }}</p>
            <p><strong>Quantity:</strong> {{ item.quantity }}</p>
            <p>
              <strong>Date:</strong>
              {{ item.action_date | date : 'medium' }}
            </p>
            <p
              *ngIf="
                item.previous_stock !== undefined &&
                item.new_stock !== undefined
              "
            >
              <strong>Stock Change:</strong>
              {{ item.previous_stock }} → {{ item.new_stock }}
            </p>
            <p *ngIf="item.notes"><strong>Notes:</strong> {{ item.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        class="empty-state"
        *ngIf="!loading && !error && historyItems.length === 0"
      >
        <p>No inventory history found</p>
      </div>
    </div>
  `,
  styles: [
    `
      .history-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .history-header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
      }

      .history-header h2 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 2rem;
        font-weight: 600;
      }

      .subtitle {
        margin: 0;
        color: #666;
        font-size: 1rem;
      }

      .loading-container,
      .error-container {
        text-align: center;
        padding: 60px 20px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container p {
        color: #dc3545;
        font-size: 1.1rem;
        margin-bottom: 20px;
      }

      .retry-btn {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
      }

      .retry-btn:hover {
        background-color: #0056b3;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .history-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        padding: 20px;
        border: 1px solid #e9ecef;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .history-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .action-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .action-add {
        background-color: #d4edda;
        color: #155724;
      }

      .action-update {
        background-color: #fff3cd;
        color: #856404;
      }

      .action-delete {
        background-color: #f8d7da;
        color: #721c24;
      }

      .action-take {
        background-color: #cce5ff;
        color: #004085;
      }

      .action-request {
        background-color: #e2e3e5;
        color: #383d41;
      }

      .history-details {
        margin-bottom: 15px;
      }

      .history-details p {
        margin: 8px 0;
        color: #666;
        font-size: 0.95rem;
      }

      .history-details strong {
        color: #333;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      .empty-state p {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }

      @media (max-width: 768px) {
        .history-container {
          padding: 15px;
        }

        .history-header h2 {
          font-size: 1.5rem;
        }

        .history-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
      }
    `,
  ],
})
export class InventoryHistoryComponent implements OnInit {
  historyItems: InventoryHistoryItem[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    // For now, we'll use a mock implementation since we don't have a backend endpoint for history
    // In a real implementation, you would call: this.inventoryService.getInventoryHistory()
    setTimeout(() => {
      this.loading = false;
      this.historyItems = this.getMockHistoryData();
    }, 1000);
  }

  private getMockHistoryData(): InventoryHistoryItem[] {
    return [
      {
        id: 1,
        action_type: 'ADD',
        item_name: 'Car Wash Soap',
        quantity: 50,
        user_name: 'Admin User',
        action_date: '2024-01-15T10:30:00',
        notes: 'Initial stock addition',
        previous_stock: 0,
        new_stock: 50,
      },
      {
        id: 2,
        action_type: 'TAKE',
        item_name: 'Car Wash Soap',
        quantity: 5,
        user_name: 'John Employee',
        action_date: '2024-01-16T14:20:00',
        notes: 'Used for car wash service',
        previous_stock: 50,
        new_stock: 45,
      },
      {
        id: 3,
        action_type: 'UPDATE',
        item_name: 'Microfiber Cloths',
        quantity: 100,
        user_name: 'Admin User',
        action_date: '2024-01-17T09:15:00',
        notes: 'Updated stock count after inventory check',
        previous_stock: 75,
        new_stock: 100,
      },
      {
        id: 4,
        action_type: 'REQUEST',
        item_name: 'Tire Shine',
        quantity: 10,
        user_name: 'Sarah Employee',
        action_date: '2024-01-18T16:45:00',
        notes: 'Request for upcoming detailing service',
        previous_stock: 20,
        new_stock: 20,
      },
      {
        id: 5,
        action_type: 'DELETE',
        item_name: 'Expired Wax',
        quantity: 0,
        user_name: 'Admin User',
        action_date: '2024-01-19T11:00:00',
        notes: 'Removed expired product',
        previous_stock: 15,
        new_stock: 0,
      },
    ];
  }
}
