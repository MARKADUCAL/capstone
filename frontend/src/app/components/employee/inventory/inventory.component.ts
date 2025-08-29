import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { RequestInventoryModalComponent } from './request-inventory-modal.component';
import {
  InventoryService,
  InventoryItem,
  InventoryRequest,
} from '../../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, RequestInventoryModalComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  loading: boolean = true;
  error: string | null = null;
  showRequestModal = false;
  selectedItem: InventoryItem | null = null;

  constructor(
    private inventoryService: InventoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.error = null;

    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.loading = false;
        this.inventoryItems = items;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error loading inventory. Please try again later.';
        console.error('Error loading inventory:', err);
      },
    });
  }

  showDetails(item: InventoryItem) {
    // Show item details in a modal or expand the card
    console.log('Showing details for:', item.name);
    // You can implement a details modal here
  }

  requestItem(item: InventoryItem) {
    this.selectedItem = item;
    this.showRequestModal = true;
  }

  onCloseRequestModal() {
    this.showRequestModal = false;
    this.selectedItem = null;
  }

  onRequestSubmitted(request: InventoryRequest) {
    // Handle the submitted request
    console.log('Inventory request submitted:', request);
    this.showRequestModal = false;
    this.selectedItem = null;

    // Show success message
    alert(
      'Inventory request submitted successfully! Please wait for admin approval.'
    );

    // Optionally reload inventory to show updated stock
    // this.loadInventory();
  }

  getStockStatus(stock: number): { status: string; color: string } {
    return this.inventoryService.getStockStatus(stock);
  }
}
