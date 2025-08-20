import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-register.component.html',
  styleUrl: './employee-register.component.css',
  host: { ngSkipHydration: 'true' },
})
export class EmployeeRegisterComponent {
  employee = {
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    position: '',
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
      !this.employee.first_name ||
      !this.employee.last_name ||
      !this.employee.email ||
      !this.employee.phone ||
      !this.employee.password ||
      !this.employee.confirm_password ||
      !this.employee.employee_id ||
      !this.employee.position
    ) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    if (this.employee.password !== this.employee.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.employee.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    const registrationData = {
      employee_id: this.employee.employee_id,
      first_name: this.employee.first_name,
      last_name: this.employee.last_name,
      email: this.employee.email,
      phone: this.employee.phone,
      password: this.employee.password,
      position: this.employee.position,
    };

    this.http
      .post(
        'http://localhost/autowash-hub-api/api/register_employee',
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
            this.router.navigate(['/employee-login']);
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
