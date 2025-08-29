import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InventoryService,
  InventoryRequest,
} from '../../../services/inventory.service';

@Component({
  selector: 'app-inventory-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="requests-container">
      <div class="requests-header">
        <h2>Inventory Requests</h2>
        <p class="subtitle">Manage employee inventory requests</p>
        <p style="color: red; font-weight: bold;">
          DEBUG: Component is rendered!
        </p>
      </div>

      <!-- Loading state -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Loading requests...</p>
      </div>

      <!-- Error state -->
      <div class="error-container" *ngIf="error && !loading">
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadRequests()">Retry</button>
      </div>

      <!-- Requests list -->
      <div class="requests-list" *ngIf="!loading && !error">
        <div class="request-card" *ngFor="let request of requests">
          <div class="request-header">
            <h3>{{ request.item_name }}</h3>
            <span class="status-badge" [class]="'status-' + request.status">
              {{ request.status | titlecase }}
            </span>
          </div>

          <div class="request-details">
            <p><strong>Employee:</strong> {{ request.employee_name }}</p>
            <p><strong>Quantity:</strong> {{ request.quantity }}</p>
            <p>
              <strong>Request Date:</strong>
              {{ request.request_date | date : 'mediumDate' }}
            </p>
            <p *ngIf="request.notes">
              <strong>Notes:</strong> {{ request.notes }}
            </p>
          </div>

          <div class="request-actions" *ngIf="request.status === 'pending'">
            <button
              class="action-btn approve"
              (click)="approveRequest(request)"
            >
              Approve
            </button>
            <button class="action-btn reject" (click)="rejectRequest(request)">
              Reject
            </button>
          </div>
          <div class="request-actions" *ngIf="request.status === 'approved'">
            <button
              class="action-btn take"
              (click)="takeItemForEmployee(request)"
            >
              Take Item
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        class="empty-state"
        *ngIf="!loading && !error && requests.length === 0"
      >
        <p>No inventory requests found</p>
      </div>
    </div>
  `,
  styles: [
    `
      .requests-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .requests-header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
      }

      .requests-header h2 {
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

      .requests-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .request-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        padding: 20px;
        border: 1px solid #e9ecef;
      }

      .request-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .request-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-pending {
        background-color: #fff3cd;
        color: #856404;
      }

      .status-approved {
        background-color: #d4edda;
        color: #155724;
      }

      .status-rejected {
        background-color: #f8d7da;
        color: #721c24;
      }

      .status-completed {
        background-color: #d1ecf1;
        color: #0c5460;
      }

      .request-details {
        margin-bottom: 15px;
      }

      .request-details p {
        margin: 8px 0;
        color: #666;
        font-size: 0.95rem;
      }

      .request-details strong {
        color: #333;
      }

      .request-actions {
        display: flex;
        gap: 10px;
      }

      .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .action-btn.approve {
        background-color: #28a745;
        color: white;
      }

      .action-btn.approve:hover {
        background-color: #218838;
      }

      .action-btn.reject {
        background-color: #dc3545;
        color: white;
      }

      .action-btn.reject:hover {
        background-color: #c82333;
      }

      .action-btn.take {
        background-color: #17a2b8;
        color: white;
      }

      .action-btn.take:hover {
        background-color: #138496;
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
        .requests-container {
          padding: 15px;
        }

        .requests-header h2 {
          font-size: 1.5rem;
        }

        .request-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .request-actions {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class InventoryRequestsComponent implements OnInit, OnDestroy {
  requests: InventoryRequest[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit() {
    console.log('InventoryRequestsComponent ngOnInit called');
    // Add a small delay to ensure the component is fully rendered
    setTimeout(() => {
      this.loadRequests();
    }, 100);
  }

  ngOnDestroy() {
    console.log('InventoryRequestsComponent ngOnDestroy called');
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;

    console.log('Loading inventory requests...');
    this.inventoryService.getInventoryRequests().subscribe({
      next: (requests) => {
        console.log('Received requests:', requests);
        this.loading = false;
        this.requests = requests;
        console.log('Updated requests array:', this.requests);
      },
      error: (err) => {
        console.error('Error loading inventory requests:', err);
        this.loading = false;
        this.error =
          'Error loading inventory requests. Please try again later.';
      },
    });
  }

  approveRequest(request: InventoryRequest): void {
    this.updateRequestStatus(request, 'approved');
  }

  rejectRequest(request: InventoryRequest): void {
    this.updateRequestStatus(request, 'rejected');
  }

  takeItemForEmployee(request: InventoryRequest): void {
    // Call the service to take item for employee
    this.inventoryService
      .takeItemForEmployee(
        request.item_id,
        request.quantity,
        request.employee_id,
        request.employee_name
      )
      .subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            // Update request status to completed
            this.updateRequestStatus(request, 'completed');
            alert(`Item taken successfully for ${request.employee_name}`);
          } else {
            alert(
              response?.status?.message || 'Failed to take item for employee'
            );
          }
        },
        error: (err) => {
          console.error('Error taking item for employee:', err);
          alert('Error taking item for employee. Please try again.');
        },
      });
  }

  private updateRequestStatus(
    request: InventoryRequest,
    status: 'approved' | 'rejected' | 'completed'
  ): void {
    const updateData = {
      id: request.id,
      status: status,
    };

    this.inventoryService.updateInventoryRequest(updateData).subscribe({
      next: (response: any) => {
        if (response?.status?.remarks === 'success') {
          // Update the local request status
          request.status = status;
          alert(`Request ${status} successfully`);
        } else {
          alert(response?.status?.message || `Failed to ${status} request`);
        }
      },
      error: (err) => {
        console.error(`Error ${status}ing request:`, err);
        alert(`Error ${status}ing request. Please try again.`);
      },
    });
  }
}
