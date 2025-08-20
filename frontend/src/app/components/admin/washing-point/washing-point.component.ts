import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

interface WashingPoint {
  id: number;
  name: string;
  location: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  pricePerHour: number;
  phone?: string;
}

@Component({
  selector: 'app-washing-point',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './washing-point.component.html',
  styleUrl: './washing-point.component.css',
})
export class WashingPointComponent implements OnInit {
  washingPoints: WashingPoint[] = [
    {
      id: 1,
      name: 'Elite Auto Spa',
      location: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      status: 'Available',
      pricePerHour: 10,
      phone: '123-456-7890',
    },
    {
      id: 2,
      name: 'Elite Auto Spa',
      location: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      status: 'Available',
      pricePerHour: 12,
      phone: '123-456-7890',
    },
    {
      id: 3,
      name: 'Elite Auto Spa',
      location: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      status: 'Available',
      pricePerHour: 10,
      phone: '123-456-7890',
    },
    {
      id: 4,
      name: 'Elite Auto Spa',
      location: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      status: 'Available',
      pricePerHour: 15,
      phone: '123-456-7890',
    },
    {
      id: 5,
      name: 'Elite Auto Spa',
      location: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      status: 'Available',
      pricePerHour: 12,
      phone: '123-456-7890',
    },
  ];

  displayedColumns: string[] = [
    'id',
    'name',
    'location',
    'status',
    'pricePerHour',
    'actions',
  ];

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load washing points data
  }

  addWashingPoint(): void {
    // Implement add functionality
  }

  editWashingPoint(point: WashingPoint): void {
    // Implement edit functionality
  }

  deleteWashingPoint(id: number): void {
    // Implement delete functionality
    const index = this.washingPoints.findIndex((point) => point.id === id);
    if (index > -1) {
      this.washingPoints.splice(index, 1);
      this.showNotification('Washing point deleted successfully');
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
