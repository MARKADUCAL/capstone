import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
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
  isTaken?: boolean;
  takenBy?: string;
  takenDate?: string;
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
  imageLoading: boolean = false;
  editImageLoading: boolean = false;
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

          // Load inventory requests to check which items have been taken
          this.loadInventoryRequests();
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

  private loadInventoryRequests(): void {
    this.inventoryService.getInventoryRequests().subscribe({
      next: (requests) => {
        // Update inventory items with taken status
        this.inventoryItems = this.inventoryItems.map((item) => {
          const completedRequest = requests.find(
            (request) =>
              request.item_id === item.id && request.status === 'completed'
          );

          if (completedRequest) {
            return {
              ...item,
              isTaken: true,
              takenBy: completedRequest.employee_name,
              takenDate: completedRequest.request_date,
            };
          }
          return item;
        });
      },
      error: (err) => {
        console.error('Error loading inventory requests:', err);
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
    // Don't allow taking items that are already taken
    if (item.isTaken) {
      this.showNotification('This item has already been taken');
      return;
    }

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

    console.log('Submitting take item form:', {
      itemId: this.selectedItem.id,
      quantity: quantity,
      employeeId: employeeId,
      employeeName: employeeName,
    });

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
          console.log('Take item response:', response);
          if (response?.status?.remarks === 'success') {
            this.showNotification(`Item taken for ${employeeName}`);
            this.closeTakeItemModal();

            // Update the item status locally
            const itemIndex = this.inventoryItems.findIndex(
              (item) => item.id === this.selectedItem?.id
            );
            if (itemIndex !== -1) {
              this.inventoryItems[itemIndex] = {
                ...this.inventoryItems[itemIndex],
                isTaken: true,
                takenBy: employeeName,
                takenDate: new Date().toISOString(),
              };
            }

            this.loadInventory(); // Reload to update stock
          } else {
            console.error('Take item failed:', response);
            this.showNotification(
              response?.status?.message || 'Failed to take item'
            );
          }
        },
        error: (err) => {
          console.error('Take item error:', err);
          console.error('Error details:', {
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message,
          });
          this.showNotification(
            'Error taking item for employee. Please try again.'
          );
        },
      });
  }

  // Image handling methods
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url);
    } catch {
      return false;
    }
  }

  onImageUrlChange(): void {
    this.imageLoading = true;
  }

  onImageLoad(): void {
    this.imageLoading = false;
  }

  onImageError(): void {
    this.imageLoading = false;
  }

  onEditImageUrlChange(): void {
    this.editImageLoading = true;
  }

  onEditImageLoad(): void {
    this.editImageLoading = false;
  }

  onEditImageError(): void {
    this.editImageLoading = false;
  }

  selectImage(): void {
    if (this.newItem.imageUrl && this.isValidImageUrl(this.newItem.imageUrl)) {
      this.showNotification('Image selected! You can now save the item.');
    }
  }

  selectEditImage(): void {
    if (
      this.editItemData?.imageUrl &&
      this.isValidImageUrl(this.editItemData.imageUrl)
    ) {
      this.showNotification('Image selected! You can now save the changes.');
    }
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
