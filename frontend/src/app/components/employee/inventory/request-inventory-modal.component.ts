import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InventoryService,
  InventoryItem,
  InventoryRequest,
} from '../../../services/inventory.service';

@Component({
  selector: 'app-request-inventory-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Request Inventory Item</h2>
          <span class="close-btn" (click)="close()">&times;</span>
        </div>

        <div class="modal-body" *ngIf="selectedItem">
          <div class="item-info">
            <div class="item-image">
              <img [src]="selectedItem.imageUrl" [alt]="selectedItem.name" />
            </div>
            <div class="item-details">
              <h3>{{ selectedItem.name }}</h3>
              <p>Available Stock: {{ selectedItem.stock }}</p>
              <p *ngIf="selectedItem.category">
                Category: {{ selectedItem.category }}
              </p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" #requestForm="ngForm">
            <div class="form-group">
              <label for="quantity">Quantity to Request:</label>
              <input
                type="number"
                id="quantity"
                [(ngModel)]="request.quantity"
                name="quantity"
                required
                min="1"
                [max]="selectedItem.stock"
                class="form-control"
              />
              <small class="form-text"
                >Maximum available: {{ selectedItem.stock }}</small
              >
            </div>

            <div class="form-group">
              <label for="notes">Notes (Optional):</label>
              <textarea
                id="notes"
                [(ngModel)]="request.notes"
                name="notes"
                rows="3"
                class="form-control"
                placeholder="Why do you need this item?"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-btn" (click)="close()">
                Cancel
              </button>
              <button
                type="submit"
                class="submit-btn"
                [disabled]="!requestForm.valid || isSubmitting"
              >
                {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
      }

      .modal-header h2 {
        margin: 0;
        color: #333;
      }

      .close-btn {
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        font-weight: bold;
      }

      .close-btn:hover {
        color: #333;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .item-info {
        display: flex;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 8px;
      }

      .item-image {
        width: 80px;
        height: 80px;
        margin-right: 1rem;
        border-radius: 4px;
        overflow: hidden;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .item-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .item-details h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .item-details p {
        margin: 0.25rem 0;
        color: #666;
        font-size: 0.9rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .form-control:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      .form-text {
        font-size: 0.875rem;
        color: #6c757d;
        margin-top: 0.25rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
      }

      .cancel-btn,
      .submit-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        border: none;
      }

      .cancel-btn {
        background-color: #f1f1f1;
        color: #333;
        border: 1px solid #ddd;
      }

      .cancel-btn:hover {
        background-color: #e9ecef;
      }

      .submit-btn {
        background-color: #007bff;
        color: white;
      }

      .submit-btn:hover:not(:disabled) {
        background-color: #0056b3;
      }

      .submit-btn:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }
    `,
  ],
})
export class RequestInventoryModalComponent {
  @Input() selectedItem: InventoryItem | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<InventoryRequest>();

  request: Partial<InventoryRequest> = {
    quantity: 1,
    notes: '',
    status: 'pending',
    request_date: new Date().toISOString().split('T')[0],
  };

  isSubmitting = false;

  constructor(private inventoryService: InventoryService) {}

  close() {
    this.closeModal.emit();
  }

  onSubmit() {
    if (!this.selectedItem) return;

    this.isSubmitting = true;

    // Create the request object
    const inventoryRequest: InventoryRequest = {
      item_id: this.selectedItem.id,
      item_name: this.selectedItem.name,
      quantity: this.request.quantity || 1,
      employee_id: this.getEmployeeId(),
      employee_name: this.getEmployeeName(),
      status: 'pending',
      request_date: new Date().toISOString().split('T')[0],
      notes: this.request.notes || '',
    };

    // Submit the request using the service
    this.inventoryService.submitInventoryRequest(inventoryRequest).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response?.status?.remarks === 'success') {
          this.requestSubmitted.emit(inventoryRequest);
        } else {
          alert(response?.status?.message || 'Failed to submit request');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error submitting request:', err);
        alert('Error submitting request. Please try again.');
      },
    });
  }

  private getEmployeeId(): string {
    // Get employee ID from localStorage or session
    // This should be implemented based on your authentication system
    return localStorage.getItem('employee_id') || 'EMP-001';
  }

  private getEmployeeName(): string {
    // Get employee name from localStorage or session
    // This should be implemented based on your authentication system
    const firstName = localStorage.getItem('employee_first_name') || 'Employee';
    const lastName = localStorage.getItem('employee_last_name') || 'User';
    return `${firstName} ${lastName}`;
  }
}
