import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-register.component.html',
  styleUrl: './admin-register.component.css',
  host: { ngSkipHydration: 'true' },
})
export class AdminRegisterComponent {
  admin = {
    admin_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    // admin_key removed temporarily
  };

  termsAccepted = false;
  errorMessage = '';
  isLoading = false;
  isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  onSubmit(): void {
    // Reset error message
    this.errorMessage = '';
    this.isLoading = true;

    // Add terms validation
    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions';
      this.isLoading = false;
      return;
    }

    // Basic validation for required fields
    if (
      !this.admin.first_name ||
      !this.admin.last_name ||
      !this.admin.email ||
      !this.admin.phone ||
      !this.admin.password ||
      !this.admin.confirm_password ||
      !this.admin.admin_id
    ) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    if (this.admin.password !== this.admin.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.admin.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    const registrationData = {
      admin_id: this.admin.admin_id,
      first_name: this.admin.first_name,
      last_name: this.admin.last_name,
      email: this.admin.email,
      phone: this.admin.phone,
      password: this.admin.password,
      // admin_key removed from data
    };

    this.http
      .post(
        `${environment.apiUrl}/register_admin`,
        registrationData,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Response:', response);
          if (response.status.remarks === 'success') {
            // Show success message before redirecting (only if in browser)
            if (this.isBrowser) {
              try {
                alert('Registration successful! Please login.');
              } catch (err) {
                console.error('Error with browser API:', err);
              }
            }
            this.router.navigate(['/admin-login']);
          } else {
            this.errorMessage =
              response.status.message || 'Registration failed';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error', error);
          if (error.error?.status?.message) {
            this.errorMessage = error.error.status.message;
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to server. Please try again later.';
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        },
      });
  }
}
