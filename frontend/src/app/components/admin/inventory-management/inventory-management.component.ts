import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface InventoryItem {
  id: number;
  name: string;
  imageUrl: string;
  stock: number;
  price: number;
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
  ],
  templateUrl: './inventory-management.component.html',
  styleUrl: './inventory-management.component.css',
})
export class InventoryManagementComponent implements OnInit {
  inventoryItems: InventoryItem[] = [
    {
      id: 1,
      name: 'Car Shampoo',
      imageUrl: 'assets/images/car-shampoo.jpg',
      stock: 5,
      price: 19.99,
    },
    {
      id: 2,
      name: 'Car Shampoo',
      imageUrl: 'assets/images/car-shampoo.jpg',
      stock: 5,
      price: 19.99,
    },
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load inventory data
  }

  addItem(): void {
    // Implement add item functionality
  }

  editItem(item: InventoryItem): void {
    // Implement edit functionality
  }

  deleteItem(item: InventoryItem): void {
    const index = this.inventoryItems.findIndex((i) => i.id === item.id);
    if (index > -1) {
      this.inventoryItems.splice(index, 1);
      this.showNotification('Item deleted successfully');
    }
  }

  takeItem(item: InventoryItem): void {
    if (item.stock > 0) {
      item.stock--;
      this.showNotification('Item taken from inventory');
    } else {
      this.showNotification('No stock available');
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
