import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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

  isAddModalOpen = false;
  newEmployee: Employee = this.createEmptyEmployee();

  constructor(
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Load employees data
  }

  openAddEmployeeModal(): void {
    this.newEmployee = this.createEmptyEmployee();
    this.isAddModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
  }

  closeAddEmployeeModal(): void {
    this.isAddModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  submitEmployeeForm(): void {
    if (this.validateEmployeeForm()) {
      // Generate a new ID
      this.newEmployee.id = this.generateEmployeeId();

      // Add employee to the list
      this.employees.push({ ...this.newEmployee });

      // Show success message
      this.showNotification('Employee added successfully');

      // Close the modal
      this.closeAddEmployeeModal();
    } else {
      this.showNotification('Please fill all required fields');
    }
  }

  addEmployee(): void {
    this.openAddEmployeeModal();
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

  private validateEmployeeForm(): boolean {
    return !!(
      this.newEmployee.name &&
      this.newEmployee.role &&
      this.newEmployee.phone &&
      this.newEmployee.status
    );
  }

  private generateEmployeeId(): number {
    // Find the maximum ID and add 1
    const maxId = Math.max(...this.employees.map((e) => e.id), 0);
    return maxId + 1;
  }

  private createEmptyEmployee(): Employee {
    return {
      id: 0,
      name: '',
      role: '',
      phone: '',
      status: 'Active',
    };
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
