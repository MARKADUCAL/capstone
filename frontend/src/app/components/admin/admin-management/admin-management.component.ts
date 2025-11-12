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

  // Pending approval modal
  isPendingModalOpen: boolean = false;
  pendingAdmins: Admin[] = [];
  pendingError: string | null = null;

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
          // Check if approval feature is enabled
          const hasApprovalFlag = response.payload.admins.some(
            (a: any) => 'is_approved' in a && a.is_approved !== undefined
          );

          // Filter to show only approved admins (is_approved === 1)
          const approvedAdmins = hasApprovalFlag
            ? response.payload.admins.filter(
                (admin: any) => admin.is_approved === 1
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

  openPendingModal(): void {
    this.pendingError = null;
    this.http.get(`${this.apiUrl}/get_all_admins`).subscribe({
      next: (response: any) => {
        const list = response?.payload?.admins || [];
        const hasApprovalFlag = list.some(
          (a: any) => 'is_approved' in a && a.is_approved !== undefined
        );

        if (hasApprovalFlag) {
          const mapped = list.map((a: any) => ({
            id: a.id,
            adminId: a.admin_id,
            name: `${a.first_name} ${a.last_name}`,
            email: a.email,
            phone: a.phone || 'N/A',
            status: 'Inactive' as 'Active' | 'Inactive',
            registrationDate: this.formatDate(a.created_at),
          }));

          this.pendingAdmins = mapped.filter((adm: Admin, i: number) => {
            const isApproved = list[i].is_approved;
            return (
              isApproved === 0 ||
              isApproved === null ||
              isApproved === undefined
            );
          });
        } else {
          this.pendingAdmins = [];
          this.pendingError =
            'Approval feature is not enabled. Please add the is_approved column to the admins table.';
        }
        this.isPendingModalOpen = true;
      },
      error: (err) => {
        console.error('Error loading pending admins:', err);
        this.pendingError = 'Failed to load pending registrations.';
        this.isPendingModalOpen = true;
      },
    });
  }

  closePendingModal(): void {
    this.isPendingModalOpen = false;
  }

  approveAdmin(admin: Admin): void {
    Swal.fire({
      title: 'Approve Admin?',
      text: `Are you sure you want to approve ${admin.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .put(`${this.apiUrl}/approve_admin`, { id: admin.id })
          .subscribe({
            next: (response: any) => {
              if (response?.status?.remarks === 'success') {
                Swal.fire({
                  title: 'Approved!',
                  text: `${admin.name} has been approved successfully.`,
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#4CAF50',
                });
                this.pendingAdmins = this.pendingAdmins.filter(
                  (a) => a.id !== admin.id
                );
                this.loadAdmins();
              } else {
                Swal.fire({
                  title: 'Error!',
                  text: response?.status?.message || 'Failed to approve admin',
                  icon: 'error',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#f44336',
                });
              }
            },
            error: () => {
              Swal.fire({
                title: 'Error!',
                text: 'Failed to approve admin',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#f44336',
              });
            },
          });
      }
    });
  }

  rejectAdmin(admin: Admin): void {
    Swal.fire({
      title: 'Reject Admin?',
      text: `Are you sure you want to decline ${admin.name}? This will remove their registration.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, decline',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .put(`${this.apiUrl}/reject_admin`, { id: admin.id })
          .subscribe({
            next: (response: any) => {
              if (response?.status?.remarks === 'success') {
                Swal.fire({
                  title: 'Declined',
                  text: `${admin.name}'s registration has been removed.`,
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#4CAF50',
                });
                this.pendingAdmins = this.pendingAdmins.filter(
                  (a) => a.id !== admin.id
                );
                this.loadAdmins();
              } else {
                Swal.fire({
                  title: 'Error!',
                  text: response?.status?.message || 'Failed to decline admin',
                  icon: 'error',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#f44336',
                });
              }
            },
            error: () => {
              Swal.fire({
                title: 'Error!',
                text: 'Failed to decline admin',
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
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
