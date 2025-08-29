import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface AdminProfile {
  id: number;
  admin_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  profile: AdminProfile = {
    id: 0,
    admin_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  };

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isEditing: boolean = false;
  isSaving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadProfile();
    this.checkUserType();
  }

  checkUserType(): void {
    if (!this.isBrowser) return;

    // Get the current route
    const currentUrl = this.router.url;

    // Check if we're in an admin view but showing a different profile type
    if (
      currentUrl.includes('admin-view') &&
      !localStorage.getItem('admin_data')
    ) {
      // Redirect to login or display error
      this.errorMessage = 'You are not authorized to view this page.';
      setTimeout(() => {
        this.router.navigate(['/admin']);
      }, 2000);
    }
  }

  loadProfile(): void {
    if (!this.isBrowser) return;

    const adminData = localStorage.getItem('admin_data');
    if (adminData) {
      this.profile = { ...this.profile, ...JSON.parse(adminData) };
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Password validation if changing password
    if (this.newPassword) {
      if (!this.currentPassword) {
        this.errorMessage = 'Current password is required to change password';
        this.isSaving = false;
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'New password and confirm password do not match';
        this.isSaving = false;
        return;
      }

      if (this.newPassword.length < 6) {
        this.errorMessage = 'Password must be at least 6 characters long';
        this.isSaving = false;
        return;
      }
    }

    if (!this.isBrowser) {
      this.errorMessage =
        'Profile update is only available in browser environment';
      this.isSaving = false;
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      this.errorMessage = 'Not authorized';
      this.isSaving = false;
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    const updateData = {
      id: this.profile.id,
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      email: this.profile.email,
      phone: this.profile.phone,
      current_password: this.currentPassword,
      new_password: this.newPassword || null,
    };

    this.http
      .put(`${this.apiUrl}/update_admin_profile`, updateData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isSaving = false;
          if (response.status && response.status.remarks === 'success') {
            this.successMessage = 'Profile updated successfully';

            // Update localStorage
            if (response.payload && response.payload.admin) {
              localStorage.setItem(
                'admin_data',
                JSON.stringify(response.payload.admin)
              );
            } else {
              // If backend doesn't return updated data, update with current form data
              localStorage.setItem('admin_data', JSON.stringify(this.profile));
            }

            // Reset password fields
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';

            this.isEditing = false;
          } else {
            this.errorMessage =
              response.status?.message || 'Failed to update profile';
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.errorMessage =
            error.error?.status?.message ||
            'An error occurred while updating profile';
          console.error('Profile update error:', error);
        },
      });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadProfile(); // Reload original data
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.successMessage = '';
    this.errorMessage = '';
  }
}
