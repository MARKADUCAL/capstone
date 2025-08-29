import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-register.component.html',
  styleUrl: './customer-register.component.css',
  hostDirectives: [],
  host: { ngSkipHydration: 'true' },
})
export class CustomerRegisterComponent {
  customer = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  };

  termsAccepted = false;
  errorMessage = '';
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    // Reset error message
    this.errorMessage = '';
    this.isLoading = true;

    console.log('Registration form submitted:', {
      ...this.customer,
      password: '[REDACTED]',
      confirm_password: '[REDACTED]',
      termsAccepted: this.termsAccepted,
    });

    // Add terms validation
    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions';
      this.isLoading = false;
      return;
    }

    // Basic validation
    if (
      !this.customer.first_name ||
      !this.customer.last_name ||
      !this.customer.email ||
      !this.customer.phone ||
      !this.customer.password ||
      !this.customer.confirm_password
    ) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    if (this.customer.password !== this.customer.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    // Password length validation
    if (this.customer.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      this.isLoading = false;
      return;
    }

    // Phone number validation
    if (!/^\d{11}$/.test(this.customer.phone)) {
      this.errorMessage = 'Phone number must be exactly 11 digits';
      this.isLoading = false;
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customer.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    const registrationData = {
      first_name: this.customer.first_name,
      last_name: this.customer.last_name,
      email: this.customer.email,
      phone: this.customer.phone,
      password: this.customer.password,
    };

    console.log('Sending registration data to API:', {
      ...registrationData,
      password: '[REDACTED]',
    });

    this.http
      .post(
        `${environment.apiUrl}/register_customer`,
        registrationData,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Registration response:', response);
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            // Show success message before redirecting
            alert('Registration successful! Please login.');
            this.router.navigate(['/customer']);
          } else {
            this.errorMessage =
              (response && response.status && response.status.message) ||
              'Registration failed with unknown error';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          if (error.error && error.error.status && error.error.status.message) {
            this.errorMessage = error.error.status.message;
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to server. Please check if the backend is running and accessible.';
          } else if (error.status === 400) {
            this.errorMessage =
              'Invalid registration data. Please check your inputs.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = `Registration failed with status ${error.status}. Please try again.`;
          }
        },
      });
  }
}
