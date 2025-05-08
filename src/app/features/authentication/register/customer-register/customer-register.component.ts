import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    // Reset error message
    this.errorMessage = '';

    // Add terms validation
    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions';
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
      return;
    }

    if (this.customer.password !== this.customer.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customer.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    const registrationData = {
      first_name: this.customer.first_name,
      last_name: this.customer.last_name,
      email: this.customer.email,
      phone: this.customer.phone,
      password: this.customer.password,
    };

    this.http
      .post(
        'http://localhost/autowash-hub-api/api/register_customer',
        registrationData,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: (response: any) => {
          console.log('Response:', response);
          if (response.status.remarks === 'success') {
            // Show success message before redirecting
            alert('Registration successful! Please login.');
            this.router.navigate(['/customer-login']);
          } else {
            this.errorMessage =
              response.status.message || 'Registration failed';
          }
        },
        error: (error) => {
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
