import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-inventory-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>Add New Inventory Item</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Item Name:</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="item.name"
              name="name"
              required
            />
          </div>

          <div class="form-group">
            <label for="image">Image URL:</label>
            <input
              type="text"
              id="image"
              [(ngModel)]="item.imageUrl"
              name="imageUrl"
              required
            />
          </div>

          <div class="form-group">
            <label for="stock">Stock Quantity:</label>
            <input
              type="number"
              id="stock"
              [(ngModel)]="item.stock"
              name="stock"
              required
              min="0"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" (click)="close()">
              Cancel
            </button>
            <button type="submit" class="submit-btn">Add Item</button>
          </div>
        </form>
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
        padding: 2rem;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      }

      .cancel-btn {
        background-color: #f1f1f1;
        border: 1px solid #ddd;
      }

      .submit-btn {
        background-color: #007bff;
        color: white;
        border: none;
      }

      .submit-btn:hover {
        background-color: #0056b3;
      }
    `,
  ],
})
export class AddInventoryModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<any>();

  item = {
    name: '',
    imageUrl: '',
    stock: 0,
    dateOfInput: new Date().toISOString().split('T')[0],
  };

  close() {
    this.closeModal.emit();
  }

  onSubmit() {
    this.addItem.emit(this.item);
    this.close();
  }
}
