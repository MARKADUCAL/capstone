import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  imageUrl?: string;
}

interface NewUser {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  private apiUrl = environment.apiUrl;
  loading: boolean = true;
  error: string | null = null;

  // State for view and edit modals
  selectedUser: User | null = null;
  isViewModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  editUserData: User = {
    id: 0,
    name: '',
    email: '',
    phone: '',
    registrationDate: '',
    imageUrl: undefined,
  };

  // State for add user modal
  isAddModalOpen: boolean = false;
  newUser: NewUser = this.createEmptyUser();
  isSubmitting: boolean = false;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;
    this.http.get(`${this.apiUrl}/get_all_customers`).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Customer response:', response);
        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload &&
          response.payload.customers
        ) {
          // Transform the data from the API to match the User interface
          this.users = response.payload.customers.map((customer: any) => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            phone: customer.phone || 'N/A',
            registrationDate: this.formatDate(customer.created_at),
            imageUrl: null, // No image URL from the API currently
          }));
        } else {
          this.error = 'Failed to load customers';
          this.showNotification('Failed to load customers');
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error loading customers. Please try again later.';
        console.error('Error loading customers:', error);
        this.showNotification(
          'Error loading customers. Please try again later.'
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

  addUser(): void {
    this.newUser = this.createEmptyUser();
    this.isAddModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeAddUserModal(): void {
    this.isAddModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  submitAddUserForm(): void {
    if (this.validateUserForm()) {
      this.isSubmitting = true;

      const userData = {
        first_name: this.newUser.first_name,
        last_name: this.newUser.last_name,
        email: this.newUser.email,
        phone: this.newUser.phone,
        password: this.newUser.password,
      };

      this.http.post(`${this.apiUrl}/register_customer`, userData).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            Swal.fire({
              title: 'Success!',
              text: 'Customer created successfully',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#4CAF50',
            });
            this.closeAddUserModal();
            this.loadCustomers(); // Reload the list
          } else {
            Swal.fire({
              title: 'Error!',
              text: response?.status?.message || 'Failed to create customer',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f44336',
            });
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating customer:', error);

          let errorMessage = 'Error creating customer. Please try again.';

          if (error.status === 400) {
            if (
              error.error &&
              error.error.status &&
              error.error.status.message
            ) {
              errorMessage = error.error.status.message;
            } else {
              errorMessage = 'Invalid data provided. Please check your inputs.';
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

  private validateUserForm(): boolean {
    // Check required fields
    if (
      !this.newUser.first_name ||
      !this.newUser.last_name ||
      !this.newUser.email ||
      !this.newUser.phone ||
      !this.newUser.password ||
      !this.newUser.confirm_password
    ) {
      this.showNotification('Please fill in all required fields');
      return false;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email)) {
      this.showNotification('Please enter a valid email address');
      return false;
    }

    // Check password length
    if (this.newUser.password.length < 6) {
      this.showNotification('Password must be at least 6 characters long');
      return false;
    }

    // Check password match
    if (this.newUser.password !== this.newUser.confirm_password) {
      this.showNotification('Passwords do not match');
      return false;
    }

    return true;
  }

  private createEmptyUser(): NewUser {
    return {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    };
  }

  viewUser(user: User): void {
    this.selectedUser = user;
    this.isViewModalOpen = true;
  }

  closeViewUserModal(): void {
    this.isViewModalOpen = false;
    this.selectedUser = null;
  }

  editUser(user: User): void {
    this.editUserData = { ...user };
    this.isEditModalOpen = true;
  }

  closeEditUserModal(): void {
    this.isEditModalOpen = false;
  }

  submitEditUserForm(): void {
    // Split full name into first and last name for API
    const [first_name, ...rest] = (this.editUserData.name || '').split(' ');
    const last_name = rest.join(' ').trim();

    const payload: any = {
      id: this.editUserData.id,
      first_name: first_name || this.editUserData.name,
      last_name: last_name || '',
      email: this.editUserData.email,
      phone: this.editUserData.phone,
    };

    this.http.put(`${this.apiUrl}/update_customer_profile`, payload).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          const index = this.users.findIndex(
            (u) => u.id === this.editUserData.id
          );
          if (index > -1) {
            this.users[index] = { ...this.editUserData };
          }
          Swal.fire({
            title: 'Success!',
            text: 'User updated successfully',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
          });
        } else {
          Swal.fire({
            title: 'Error!',
            text: response?.status?.message || 'Failed to update user',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f44336',
          });
        }
        this.closeEditUserModal();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating user. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f44336',
        });
        this.closeEditUserModal();
      },
    });
  }

  deleteUser(user: User): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${user.name}. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/customers/${user.id}`).subscribe({
          next: (response: any) => {
            if (
              response &&
              response.status &&
              response.status.remarks === 'success'
            ) {
              const index = this.users.findIndex((u) => u.id === user.id);
              if (index > -1) {
                this.users.splice(index, 1);
              }
              Swal.fire({
                title: 'Deleted!',
                text: 'User has been deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4CAF50',
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: response?.status?.message || 'Failed to delete user',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
              });
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Error deleting user. Please try again.',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f44336',
            });
          },
        });
      }
    });
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
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
