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

interface NewAdmin {
  admin_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
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
  // Add state for create modal
  isAddModalOpen: boolean = false;
  newAdmin: NewAdmin = this.createEmptyAdmin();
  isSubmitting: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
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
          // Check if approval feature is enabled
          const hasApprovalFlag = response.payload.admins.some(
            (a: any) => 'is_approved' in a && a.is_approved !== undefined,
          );

          // Filter to show only approved admins (is_approved === 1)
          const approvedAdmins = hasApprovalFlag
            ? response.payload.admins.filter(
                (admin: any) => admin.is_approved === 1,
              )
            : response.payload.admins; // If no approval flag, show all (backward compatibility)

          // Transform the data from the API to match the Admin interface
          this.admins = approvedAdmins.map((admin: any) => {
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

  openAddAdminModal(): void {
    this.newAdmin = this.createEmptyAdmin();
    this.newAdmin.admin_id = this.generateAdminId();
    this.isAddModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeAddAdminModal(): void {
    this.isAddModalOpen = false;
    this.isSubmitting = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  submitAddAdminForm(): void {
    if (!this.validateAdminForm()) {
      return;
    }

    this.isSubmitting = true;
    const payload = {
      admin_id: this.newAdmin.admin_id,
      first_name: this.newAdmin.first_name,
      last_name: this.newAdmin.last_name,
      email: this.newAdmin.email,
      phone: this.newAdmin.phone,
      password: this.newAdmin.password,
    };

    this.http.post(`${this.apiUrl}/register_admin`, payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response?.status?.remarks === 'success') {
          Swal.fire({
            title: 'Admin Created Successfully! 👋',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p><strong>Welcome ${this.newAdmin.first_name}!</strong></p>
                <p style="margin-top: 8px;">The new admin account has been registered.</p>

                <div style="background-color: #fff3cd; border-left: 4px solid #f44336; padding: 15px; margin-top: 15px; border-radius: 4px;">
                  <p style="font-weight: 700; color: #c62828; margin-bottom: 8px;">🔐 Important: Change Your Password!</p>
                  <p style="margin: 0; font-size: 14px; color: #555;">For your account security, please <strong>change your password</strong> immediately after your first login. Do not share your login credentials with anyone.</p>
                </div>

                <div style="background-color: #f0f7ff; border-left: 4px solid #2196F3; padding: 15px; margin-top: 15px; border-radius: 4px;">
                  <p style="font-weight: 600; color: #1976d2; margin-bottom: 10px;">📋 First Login Recommendations:</p>
                  <ul style="margin: 0; padding-left: 20px; text-align: left;">
                    <li style="margin-bottom: 6px;"><strong>Change Your Password</strong> – Go to Profile &gt; Change Password</li>
                    <li style="margin-bottom: 6px;">Update your profile picture in the Profile section</li>
                    <li style="margin-bottom: 6px;">Review Dashboard to understand current business metrics</li>
                    <li style="margin-bottom: 6px;">Check Employee Management to view all staff</li>
                    <li style="margin-bottom: 6px;">Review Customer Management for all registered users</li>
                    <li style="margin-bottom: 6px;">Set up Service Management and pricing rates</li>
                    <li style="margin-bottom: 6px;">Configure your business settings and preferences</li>
                    <li>Review the Landing Page Editor to customize your public page</li>
                  </ul>
                </div>

                <p style="margin-top: 15px; font-size: 13px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                  <strong>Admin ID:</strong> ${this.newAdmin.admin_id}<br>
                  <strong>Email:</strong> ${this.newAdmin.email}
                </p>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#4CAF50',
            confirmButtonText: 'Got it!',
            width: 520,
          });
          this.closeAddAdminModal();
          this.loadAdmins();
        } else {
          Swal.fire({
            title: 'Creation Failed',
            text:
              response?.status?.message ||
              'Unable to create admin. Please verify the details and try again.',
            icon: 'error',
            confirmButtonColor: '#f44336',
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const message =
          error?.error?.status?.message ||
          error?.message ||
          'Failed to create admin. Please try again.';
        Swal.fire({
          title: 'Error',
          text: message,
          icon: 'error',
          confirmButtonColor: '#f44336',
        });
      },
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
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  private validateAdminForm(): boolean {
    if (
      !this.newAdmin.first_name ||
      !this.newAdmin.last_name ||
      !this.newAdmin.email ||
      !this.newAdmin.password ||
      !this.newAdmin.confirm_password
    ) {
      this.showNotification('Please fill in all required fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newAdmin.email)) {
      this.showNotification('Please enter a valid email address.');
      return false;
    }

    if (this.newAdmin.password.length < 6) {
      this.showNotification('Password must be at least 6 characters long.');
      return false;
    }

    if (this.newAdmin.password !== this.newAdmin.confirm_password) {
      this.showNotification('Passwords do not match.');
      return false;
    }

    if (!this.newAdmin.admin_id) {
      this.showNotification('Unable to generate an admin ID.');
      return false;
    }

    return true;
  }

  private createEmptyAdmin(): NewAdmin {
    return {
      admin_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    };
  }

  private generateAdminId(): string {
    let maxId = 0;
    this.admins.forEach((admin) => {
      if (admin.adminId) {
        const match = admin.adminId.match(/ADM-(\d+)/i);
        if (match) {
          const value = parseInt(match[1], 10);
          if (!Number.isNaN(value) && value > maxId) {
            maxId = value;
          }
        }
      }
    });

    const next = maxId + 1;
    return `ADM-${next.toString().padStart(3, '0')}`;
  }
}
