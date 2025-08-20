import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  imageUrl?: string;
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
    HttpClientModule,
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

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
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
    // Implement add user functionality
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
    const index = this.users.findIndex((u) => u.id === this.editUserData.id);
    if (index > -1) {
      this.users[index] = { ...this.editUserData };
      this.showNotification('User updated successfully');
    }
    this.closeEditUserModal();
  }

  deleteUser(user: User): void {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index > -1) {
      this.users.splice(index, 1);
      this.showNotification('User deleted successfully');
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

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
