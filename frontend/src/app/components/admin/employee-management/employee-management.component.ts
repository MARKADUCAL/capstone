import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  employeeId?: string;
  registrationDate?: string;
}

interface NewEmployee {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  position: string;
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
    HttpClientModule,
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.css',
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [];
  isAddModalOpen = false;
  newEmployee: NewEmployee = this.createEmptyEmployee();
  loading: boolean = true;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  // Add state for view modal
  selectedEmployee: Employee | null = null;
  isViewModalOpen: boolean = false;

  // Add state for edit modal
  isEditModalOpen = false;
  editEmployeeData: Employee = this.createEmptyEmployeeForEdit();

  // Add state for submission
  isSubmitting: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = null;

    this.http.get(`${this.apiUrl}/get_all_employees`).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Employee response:', response);

        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload &&
          response.payload.employees
        ) {
          // Transform the data from the API to match the Employee interface
          this.employees = response.payload.employees.map((employee: any) => ({
            id: employee.id,
            employeeId: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            phone: employee.phone || 'N/A',
            role: employee.position || 'Employee',
            status: 'Active', // Default to active since we don't have a status in the DB
            registrationDate: this.formatDate(employee.created_at),
          }));
        } else {
          this.error = 'Failed to load employees';
          this.showNotification('Failed to load employees');
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error loading employees. Please try again later.';
        console.error('Error loading employees:', error);
        this.showNotification(
          'Error loading employees. Please try again later.'
        );
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      this.isSubmitting = true;

      const employeeData = {
        employee_id: this.newEmployee.employee_id,
        first_name: this.newEmployee.first_name,
        last_name: this.newEmployee.last_name,
        email: this.newEmployee.email,
        phone: this.newEmployee.phone,
        password: this.newEmployee.password,
        position: this.newEmployee.position,
      };

      this.http
        .post(`${this.apiUrl}/register_employee`, employeeData)
        .subscribe({
          next: (response: any) => {
            this.isSubmitting = false;
            if (
              response &&
              response.status &&
              response.status.remarks === 'success'
            ) {
              this.showNotification('Employee created successfully');
              this.closeAddEmployeeModal();
              this.loadEmployees(); // Reload the list
            } else {
              this.showNotification(
                response?.status?.message || 'Failed to create employee'
              );
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating employee:', error);
            this.showNotification('Error creating employee. Please try again.');
          },
        });
    } else {
      this.showNotification('Please fill all required fields correctly');
    }
  }

  addEmployee(): void {
    this.openAddEmployeeModal();
  }

  editEmployee(employee: Employee): void {
    this.editEmployeeData = { ...employee };
    this.isEditModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeEditEmployeeModal(): void {
    this.isEditModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  submitEditEmployeeForm(): void {
    // Prepare payload for API
    const [first_name, ...rest] = (this.editEmployeeData.name || '').split(' ');
    const last_name = rest.join(' ').trim();

    const payload: any = {
      id: this.editEmployeeData.id,
      first_name: first_name || this.editEmployeeData.name,
      last_name: last_name || '',
      phone: this.editEmployeeData.phone,
      position: this.editEmployeeData.role,
    };

    this.http.put(`${this.apiUrl}/update_employee`, payload).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          // Update local list
          const index = this.employees.findIndex(
            (e) => e.id === this.editEmployeeData.id
          );
          if (index > -1) {
            this.employees[index] = { ...this.editEmployeeData };
          }
          this.showNotification('Employee updated successfully');
        } else {
          this.showNotification(
            response?.status?.message || 'Failed to update employee'
          );
        }
        this.closeEditEmployeeModal();
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        this.showNotification('Error updating employee. Please try again.');
        this.closeEditEmployeeModal();
      },
    });
  }

  deleteEmployee(employee: Employee): void {
    this.http.delete(`${this.apiUrl}/employees/${employee.id}`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          const index = this.employees.findIndex((e) => e.id === employee.id);
          if (index > -1) {
            this.employees.splice(index, 1);
          }
          this.showNotification('Employee deleted successfully');
        } else {
          this.showNotification(
            response?.status?.message || 'Failed to delete employee'
          );
        }
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.showNotification('Error deleting employee. Please try again.');
      },
    });
  }

  viewEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isViewModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeViewEmployeeModal(): void {
    this.isViewModalOpen = false;
    this.selectedEmployee = null;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
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
      this.newEmployee.employee_id &&
      this.newEmployee.first_name &&
      this.newEmployee.last_name &&
      this.newEmployee.email &&
      this.newEmployee.phone &&
      this.newEmployee.password &&
      this.newEmployee.confirm_password &&
      this.newEmployee.position &&
      this.newEmployee.password === this.newEmployee.confirm_password &&
      this.newEmployee.password.length >= 6
    );
  }

  private createEmptyEmployee(): NewEmployee {
    return {
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      position: '',
    };
  }

  private createEmptyEmployeeForEdit(): Employee {
    return {
      id: 0,
      name: '',
      role: '',
      phone: '',
      email: '',
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
