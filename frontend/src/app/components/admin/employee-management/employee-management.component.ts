import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

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
  employee_id?: string;
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
          this.employees = response.payload.employees.map((employee: any) => {
            const derivedStatus =
              localStorage.getItem(`employeeStatus:${employee.id}`) || 'Active';
            return {
              id: employee.id,
              employeeId: employee.employee_id,
              name: `${employee.first_name} ${employee.last_name}`,
              email: employee.email,
              phone: employee.phone || 'N/A',
              role: employee.position || 'Employee',
              status: (derivedStatus as 'Active' | 'Inactive') || 'Active',
              registrationDate: this.formatDate(employee.created_at),
            };
          });
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
    // Generate employee ID when modal opens
    this.newEmployee.employee_id = this.generateEmployeeId();
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

  generateEmployeeId(): string {
    // Get the highest existing employee ID number
    let maxId = 0;

    this.employees.forEach((employee) => {
      if (employee.employeeId) {
        // Extract number from employee ID (e.g., "EMP-001" -> 1)
        const match = employee.employeeId.match(/EMP-(\d+)/);
        if (match) {
          const idNumber = parseInt(match[1], 10);
          if (idNumber > maxId) {
            maxId = idNumber;
          }
        }
      }
    });

    // Generate next employee ID
    const nextId = maxId + 1;
    return `EMP-${nextId.toString().padStart(3, '0')}`;
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
              Swal.fire({
                title: 'Success!',
                text: `Employee created successfully with ID: ${this.newEmployee.employee_id}`,
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4CAF50',
              });
              this.closeAddEmployeeModal();
              this.loadEmployees(); // Reload the list
            } else {
              Swal.fire({
                title: 'Error!',
                text: response?.status?.message || 'Failed to create employee',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
              });
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating employee:', error);

            let errorMessage = 'Error creating employee. Please try again.';

            if (error.status === 400) {
              if (
                error.error &&
                error.error.status &&
                error.error.status.message
              ) {
                errorMessage = error.error.status.message;
              } else {
                errorMessage =
                  'Invalid data provided. Please check your inputs.';
              }
            } else if (error.status === 409) {
              errorMessage =
                'Email already exists. Please use a different email.';
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            }

            Swal.fire({
              title: 'Error!',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f44336',
            });
          },
        });
    } else {
      Swal.fire({
        title: 'Validation Error!',
        text: 'Please fill all required fields correctly',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ff9800',
      });
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
    // Compare with original to avoid backend 404 when only status changed
    const original = this.employees.find(
      (e) => e.id === this.editEmployeeData.id
    );
    const [first_name, ...rest] = (this.editEmployeeData.name || '').split(' ');
    const last_name = rest.join(' ').trim();

    const payload: any = {
      id: this.editEmployeeData.id,
      first_name: first_name || this.editEmployeeData.name,
      last_name: last_name || '',
      phone: this.editEmployeeData.phone,
      position: this.editEmployeeData.role,
    };

    const profileChanged =
      !!original &&
      (original.name !== this.editEmployeeData.name ||
        original.role !== this.editEmployeeData.role ||
        original.phone !== this.editEmployeeData.phone);

    if (!profileChanged) {
      // Persist status locally and exit early
      try {
        localStorage.setItem(
          `employeeStatus:${this.editEmployeeData.id}`,
          this.editEmployeeData.status
        );
      } catch {}

      // Reflect status change in local list
      if (original) {
        original.status = this.editEmployeeData.status;
      }

      this.showNotification('Saved status');
      this.closeEditEmployeeModal();
      return;
    }

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
          // Persist status locally so other screens can respect it
          try {
            localStorage.setItem(
              `employeeStatus:${this.editEmployeeData.id}`,
              this.editEmployeeData.status
            );
          } catch {}
          Swal.fire({
            title: 'Success!',
            text: 'Employee updated successfully',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
          });
        } else {
          Swal.fire({
            title: 'Error!',
            text: response?.status?.message || 'Failed to update employee',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
          });
        }
        this.closeEditEmployeeModal();
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        if (error?.status === 404) {
          // Backend returns 404 when rowCount is 0 (no DB changes)
          // We already know profile changed, but if DB didn't update, still persist status and reflect UI
          try {
            localStorage.setItem(
              `employeeStatus:${this.editEmployeeData.id}`,
              this.editEmployeeData.status
            );
          } catch {}
          const idx = this.employees.findIndex(
            (e) => e.id === this.editEmployeeData.id
          );
          if (idx > -1) {
            this.employees[idx].status = this.editEmployeeData.status;
          }
          Swal.fire({
            title: 'Info!',
            text: 'No profile changes saved. Status updated locally.',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#2196F3',
          });
        } else {
          Swal.fire({
            title: 'Error!',
            text: 'Error updating employee. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
          });
        }
        this.closeEditEmployeeModal();
      },
    });
  }

  deleteEmployee(employee: Employee): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${employee.name}. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/employees/${employee.id}`).subscribe({
          next: (response: any) => {
            if (
              response &&
              response.status &&
              response.status.remarks === 'success'
            ) {
              const index = this.employees.findIndex(
                (e) => e.id === employee.id
              );
              if (index > -1) {
                this.employees.splice(index, 1);
              }
              Swal.fire({
                title: 'Deleted!',
                text: 'Employee has been deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4CAF50',
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: response?.status?.message || 'Failed to delete employee',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
              });
            }
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Error deleting employee. Please try again.',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f44336',
            });
          },
        });
      }
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
    // Check required fields
    if (
      !this.newEmployee.first_name ||
      !this.newEmployee.last_name ||
      !this.newEmployee.email ||
      !this.newEmployee.phone ||
      !this.newEmployee.password ||
      !this.newEmployee.confirm_password ||
      !this.newEmployee.position
    ) {
      this.showNotification('Please fill in all required fields');
      return false;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newEmployee.email)) {
      this.showNotification('Please enter a valid email address');
      return false;
    }

    // Check password length
    if (this.newEmployee.password.length < 6) {
      this.showNotification('Password must be at least 6 characters long');
      return false;
    }

    // Check password match
    if (this.newEmployee.password !== this.newEmployee.confirm_password) {
      this.showNotification('Passwords do not match');
      return false;
    }

    return true;
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
