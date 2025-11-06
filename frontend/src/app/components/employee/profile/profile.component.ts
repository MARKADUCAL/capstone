import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface EmployeeProfile {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  avatar_url?: string;
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

  profile: EmployeeProfile = {
    id: 0,
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
  };

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isEditing: boolean = false;
  isSaving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private apiUrl = environment.apiUrl;

  // Image upload state
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadError: string = '';
  uploadSuccess: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadProfile();
    this.checkUserType();
  }

  checkUserType(): void {
    if (!this.isBrowser) return;

    // Get the current route
    const currentUrl = this.router.url;

    // Check if we're in an employee view but showing a different profile type
    if (
      currentUrl.includes('employee-view') &&
      !localStorage.getItem('employee_data')
    ) {
      // Redirect to login or display error
      this.errorMessage = 'You are not authorized to view this page.';
      setTimeout(() => {
        this.router.navigate(['/employee']);
      }, 2000);
    }
  }

  loadProfile(): void {
    if (!this.isBrowser) return;

    const employeeData = localStorage.getItem('employee_data');
    if (employeeData) {
      this.profile = { ...this.profile, ...JSON.parse(employeeData) };
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

    const token =
      localStorage.getItem('employee_token') ||
      localStorage.getItem('auth_token');
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
      avatar_url: this.profile.avatar_url || null,
      current_password: this.currentPassword,
      new_password: this.newPassword || null,
    };

    this.http
      .put(`${this.apiUrl}/update_employee_profile`, updateData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isSaving = false;
          if (response.status && response.status.remarks === 'success') {
            this.successMessage = 'Profile updated successfully';

            // Update localStorage
            if (response.payload && response.payload.employee) {
              localStorage.setItem(
                'employee_data',
                JSON.stringify(response.payload.employee)
              );
            } else {
              // If backend doesn't return updated data, update with current form data
              localStorage.setItem(
                'employee_data',
                JSON.stringify(this.profile)
              );
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

  // Image upload methods
  onFileSelected(event: any): void {
    const file = event?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Please select a valid image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'File size must be less than 5MB.';
      return;
    }
    this.selectedFile = file;
    this.uploadError = '';
    const reader = new FileReader();
    reader.onload = (e: any) => (this.imagePreview = e.target.result);
    reader.readAsDataURL(file);
  }

  uploadAvatar(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select an image first.';
      return;
    }
    this.isUploading = true;
    const form = new FormData();
    form.append('file', this.selectedFile);
    form.append('category', 'avatar');

    this.http.post<any>(`${this.apiUrl}/upload_file`, form).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res?.status === 'success' && res?.data?.url) {
          this.profile.avatar_url = res.data.url;
          this.uploadSuccess = 'Profile picture uploaded!';
          this.uploadError = '';
          // persist locally immediately
          try {
            const stored = JSON.parse(
              localStorage.getItem('employee_data') || '{}'
            );
            localStorage.setItem(
              'employee_data',
              JSON.stringify({ ...stored, avatar_url: this.profile.avatar_url })
            );
          } catch {}
        } else {
          this.uploadError = res?.message || 'Upload failed.';
        }
      },
      error: () => {
        this.isUploading = false;
        this.uploadError = 'Upload failed. Please try again.';
      },
    });
  }

  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}
