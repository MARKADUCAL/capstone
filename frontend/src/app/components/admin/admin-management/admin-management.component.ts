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

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  adminId?: string;
  registrationDate?: string;
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.css',
})
export class AdminManagementComponent implements OnInit {
  admins: Admin[] = [];
  loading: boolean = true;
  error: string | null = null;
  private apiUrl = environment.apiUrl;

  // Add state for view modal
  selectedAdmin: Admin | null = null;
  isViewModalOpen: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.loading = true;
    this.error = null;

    this.http.get(`${this.apiUrl}/get_all_admins`).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Admin response:', response);

        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload &&
          response.payload.admins
        ) {
          // Transform the data from the API to match the Admin interface
          this.admins = response.payload.admins.map((admin: any) => {
            const derivedStatus =
              localStorage.getItem(`adminStatus:${admin.id}`) || 'Active';
            return {
              id: admin.id,
              adminId: admin.admin_id,
              name: `${admin.first_name} ${admin.last_name}`,
              email: admin.email,
              phone: admin.phone || 'N/A',
              status: (derivedStatus as 'Active' | 'Inactive') || 'Active',
              registrationDate: this.formatDate(admin.created_at),
            };
          });
        } else {
          this.error = 'Failed to load admins';
          this.showNotification('Failed to load admins');
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error loading admins. Please try again later.';
        console.error('Error loading admins:', error);
        this.showNotification('Error loading admins. Please try again later.');
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

  viewAdmin(admin: Admin): void {
    this.selectedAdmin = admin;
    this.isViewModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeViewAdminModal(): void {
    this.isViewModalOpen = false;
    this.selectedAdmin = null;
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

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
