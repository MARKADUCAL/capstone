import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './customer-login.component.html',
  styleUrl: './customer-login.component.css',
  host: { ngSkipHydration: 'true' },
})
export class CustomerLoginComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
  };
  errorMessage = '';
  isLoading = false;
  apiBaseUrl = 'http://localhost/autowash-hub-api/api'; // Default fallback URL

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Only access window when in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Dynamically determine the API base URL
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        // For local development
        this.apiBaseUrl = 'http://localhost/autowash-hub-api/api';
      } else {
        // For production environment - adjust as needed
        this.apiBaseUrl = window.location.origin + '/autowash-hub-api/api';
      }
      console.log('API Base URL:', this.apiBaseUrl);
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true;

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    console.log('Attempting login with:', this.loginData);

    this.http
      .post(`${this.apiBaseUrl}/login_customer`, this.loginData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Login response:', response);

          if (response.status && response.status.remarks === 'success') {
            // Save token and customer data to localStorage
            if (response.payload && response.payload.token) {
              localStorage.setItem('auth_token', response.payload.token);
              localStorage.setItem(
                'customer_data',
                JSON.stringify(response.payload.customer)
              );

              // Navigate to customer dashboard
              this.router.navigate(['/customer-view']);
            } else {
              this.errorMessage = 'Invalid response from server';
            }
          } else {
            this.errorMessage = response.status?.message || 'Login failed';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);

          if (error.error?.status?.message) {
            this.errorMessage = error.error.status.message;
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to server. Please check your connection.';
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 404) {
            this.errorMessage = 'API endpoint not found. Please check the URL.';
          } else {
            this.errorMessage = `Login failed (${error.status}): ${
              error.statusText || 'Unknown error'
            }`;
          }
        },
      });
  }
}
