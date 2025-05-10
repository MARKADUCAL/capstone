import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  imageUrl: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];

  ngOnInit() {
    // Sample data - replace with actual API call in production
    this.inventoryItems = [
      {
        id: 1,
        name: 'Car Shampoo',
        stock: 5,
        imageUrl: 'assets/images/car-shampoo.png', // Update with actual image path
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
    // Implement add new item logic
    console.log('Adding new item');
  }
}
