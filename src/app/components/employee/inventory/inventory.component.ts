import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddInventoryModalComponent } from './add-inventory-modal.component';

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  imageUrl: string;
  dateOfInput?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, AddInventoryModalComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  showAddModal = false;

  ngOnInit() {
    // Sample data - replace with actual API call in production
    this.inventoryItems = [
      {
        id: 1,
        name: 'Car Shampoo',
        stock: 5,
        imageUrl: 'assets/images/car-shampoo.png',
        dateOfInput: '2024-03-20',
      },
    ];
  }

  showDetails(item: InventoryItem) {
    // Implement details view logic
    console.log('Showing details for:', item.name);
  }

  editItem(item: InventoryItem) {
    // Implement edit logic
    console.log('Editing item:', item.name);
  }

  takeItem(item: InventoryItem) {
    if (item.stock > 0) {
      item.stock--;
      console.log('Taken item:', item.name, 'New stock:', item.stock);
    }
  }

  addNewItem() {
    this.showAddModal = true;
  }

  onCloseModal() {
    this.showAddModal = false;
  }

  onAddItem(newItem: any) {
    const item: InventoryItem = {
      id: this.inventoryItems.length + 1,
      name: newItem.name,
      stock: newItem.stock,
      imageUrl: newItem.imageUrl,
      dateOfInput: newItem.dateOfInput,
    };
    this.inventoryItems.push(item);
  }
}
