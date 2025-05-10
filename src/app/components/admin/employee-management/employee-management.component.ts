import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.css',
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Carwasher',
      phone: '123-456-7890',
      status: 'Active',
    },
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load employees data
  }

  addEmployee(): void {
    // Implement add employee functionality
  }

  editEmployee(employee: Employee): void {
    // Implement edit functionality
  }

  deleteEmployee(employee: Employee): void {
    const index = this.employees.findIndex((e) => e.id === employee.id);
    if (index > -1) {
      this.employees.splice(index, 1);
      this.showNotification('Employee deleted successfully');
    }
  }

  viewEmployee(employee: Employee): void {
    // Implement view employee details functionality
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
