import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { InventoryHistoryComponent } from '../inventory-history/inventory-history.component';
import { InventoryRequestsComponent } from '../inventory-requests/inventory-requests.component';
import { InventoryService } from '../../../services/inventory.service';

interface InventoryItem {
  id: number;
  name: string;
  imageUrl: string;
  stock: number;
  category?: string;
}

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    InventoryHistoryComponent,
    InventoryRequestsComponent,
  ],
  templateUrl: './inventory-management.component.html',
  styleUrl: './inventory-management.component.css',
})
export class InventoryManagementComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  loading: boolean = true;
  error: string | null = null;
  isAddModalOpen = false;
  isEditModalOpen = false;
  isViewModalOpen = false;
  isHistoryModalOpen = false;
  isRequestsModalOpen = false;
  isTakeItemModalOpen = false;
  newItem: Partial<InventoryItem> = {};
  editItemData: InventoryItem | null = null;
  selectedItem: InventoryItem | null = null;
  isSubmitting: boolean = false;
  private apiUrl = environment.apiUrl;

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private inventoryService: InventoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.error = null;
    this.http.get(`${this.apiUrl}/get_inventory`).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.status?.remarks === 'success') {
          this.inventoryItems = (response.payload?.inventory || []).map(
            (i: any) => ({
              id: i.id,
              name: i.name,
              imageUrl: i.image_url || 'assets/logo.jpg',
              stock: Number(i.stock) || 0,
              category: i.category || 'General',
            })
          );
        } else {
          this.error = response?.status?.message || 'Failed to load inventory';
          this.showNotification(this.error ?? 'Failed to load inventory');
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error loading inventory';
        this.showNotification(this.error || 'Error loading inventory');
      },
    });
  }

  addItem(): void {
    this.newItem = {
      name: '',
      stock: 0,
      imageUrl: '',
      category: '',
    } as any;
    this.isAddModalOpen = true;
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  submitAddForm(): void {
    if (!this.newItem.name || this.newItem.stock == null) {
      this.showNotification('Please fill name and stock');
      return;
    }
    this.isSubmitting = true;
    const payload = {
      name: this.newItem.name,
      image_url: this.newItem.imageUrl || null,
      stock: Number(this.newItem.stock) || 0,
      category: this.newItem.category || null,
    };
    this.http.post(`${this.apiUrl}/add_inventory_item`, payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response?.status?.remarks === 'success') {
          this.showNotification('Item added');
          this.closeAddModal();
          this.loadInventory();
        } else {
          this.showNotification(
            response?.status?.message || 'Failed to add item'
          );
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showNotification('Error adding item');
      },
    });
  }

  editItem(item: InventoryItem): void {
    this.editItemData = { ...item };
    this.isEditModalOpen = true;
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  viewItem(item: InventoryItem): void {
    this.selectedItem = { ...item };
    this.isViewModalOpen = true;
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedItem = null;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  showHistory(): void {
    this.isHistoryModalOpen = true;
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen = false;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  showRequests(): void {
    console.log('showRequests() called');
    this.isRequestsModalOpen = true;
    console.log('isRequestsModalOpen set to:', this.isRequestsModalOpen);
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  closeRequestsModal(): void {
    this.isRequestsModalOpen = false;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  submitEditForm(): void {
    if (!this.editItemData) return;
    const payload = {
      id: this.editItemData.id,
      name: this.editItemData.name,
      image_url: this.editItemData.imageUrl,
      stock: Number(this.editItemData.stock) || 0,
      category: this.editItemData.category || null,
    };
    this.http.put(`${this.apiUrl}/update_inventory_item`, payload).subscribe({
      next: (response: any) => {
        if (response?.status?.remarks === 'success') {
          this.showNotification('Item updated');
          this.closeEditModal();
          this.loadInventory();
        } else {
          this.showNotification(
            response?.status?.message || 'Failed to update item'
          );
        }
      },
      error: () => {
        this.showNotification('Error updating item');
      },
    });
  }

  deleteItem(item: InventoryItem): void {
    this.http.delete(`${this.apiUrl}/inventory/${item.id}`).subscribe({
      next: (response: any) => {
        if (response?.status?.remarks === 'success') {
          this.inventoryItems = this.inventoryItems.filter(
            (i) => i.id !== item.id
          );
          this.showNotification('Item deleted successfully');
        } else {
          this.showNotification(
            response?.status?.message || 'Failed to delete item'
          );
        }
      },
      error: () => this.showNotification('Error deleting item'),
    });
  }

  takeItem(item: InventoryItem): void {
    // Show a modal to input employee details and quantity
    this.selectedItem = item;
    this.isTakeItemModalOpen = true;
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = 'hidden';
  }

  closeTakeItemModal(): void {
    this.isTakeItemModalOpen = false;
    this.selectedItem = null;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  submitTakeItemForm(
    employeeId: string,
    employeeName: string,
    quantity: number
  ): void {
    if (!this.selectedItem) return;

    if (quantity > this.selectedItem.stock) {
      this.showNotification('Requested quantity exceeds available stock');
      return;
    }

    if (quantity <= 0) {
      this.showNotification('Quantity must be greater than 0');
      return;
    }

    // Call the service to take item for employee
    this.inventoryService
      .takeItemForEmployee(
        this.selectedItem.id,
        quantity,
        employeeId,
        employeeName
      )
      .subscribe({
        next: (response: any) => {
          if (response?.status?.remarks === 'success') {
            this.showNotification(`Item taken for ${employeeName}`);
            this.closeTakeItemModal();
            this.loadInventory(); // Reload to update stock
          } else {
            this.showNotification(
              response?.status?.message || 'Failed to take item'
            );
          }
        },
        error: (err) => {
          this.showNotification('Error taking item for employee');
        },
      });
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
