import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

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
  showPassword = false;
  showConfirmPassword = false;
  isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

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

    // Step 1: request a verification code
    this.http
      .post(
        `${environment.apiUrl}/send_registration_code`,
        { email: this.customer.email },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: async (codeResp: any) => {
          console.log('Verification code response:', codeResp);

          // Step 2: prompt for 6-digit code
          const { value: code } = await Swal.fire({
            title: 'Enter Verification Code',
            input: 'text',
            inputLabel: 'A 6-digit code was sent to your email',
            inputPlaceholder: '123456',
            inputAttributes: {
              maxlength: '6',
              inputmode: 'numeric',
              autocapitalize: 'off',
              autocorrect: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'Verify & Register',
            preConfirm: (value) => {
              if (!/^\d{6}$/.test(value)) {
                Swal.showValidationMessage('Please enter a valid 6-digit code');
              }
              return value;
            },
          });

          if (!code) {
            this.isLoading = false;
            return;
          }

          const payload: any = { ...registrationData, verification_code: code };

          // Step 3: submit registration with code
          this.http
            .post(`${environment.apiUrl}/register_customer`, payload, {
              headers: { 'Content-Type': 'application/json' },
            })
            .subscribe({
              next: (response: any) => {
                console.log('Registration response:', response);
                if (
                  response &&
                  response.status &&
                  response.status.remarks === 'success'
                ) {
                  // Automatically log in the newly registered user
                  this.autoLogin(
                    this.customer.email,
                    this.customer.password
                  );
                } else {
                  this.isLoading = false;
                  const errorMessage =
                    (response && response.status && response.status.message) ||
                    'Registration failed with unknown error';
                  this.errorMessage = errorMessage;
                  Swal.fire({
                    title: 'Registration Failed!',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'OK',
                  });
                }
              },
              error: (err) => {
                this.isLoading = false;
                console.error('Registration error:', err);
                this.errorMessage = 'Registration failed. Please try again.';
                Swal.fire({
                  title: 'Registration Failed!',
                  text: 'Registration failed. Please try again.',
                  icon: 'error',
                  confirmButtonText: 'OK',
                });
              },
            });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Send code error:', error);
          const msg =
            (error?.error?.status?.message as string) ||
            'Failed to send verification code.';
          this.errorMessage = msg;
          Swal.fire({
            title: 'Verification Failed!',
            text: msg,
            icon: 'error',
            confirmButtonText: 'OK',
          });
        },
      });
  }

  private autoLogin(email: string, password: string): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const loginData = { email, password };

    this.http
      .post(`${environment.apiUrl}/login_customer`, loginData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Auto-login response:', response);

          if (response.status && response.status.remarks === 'success') {
            // Save token and customer data to localStorage
            if (response.payload && response.payload.token) {
              if (this.isBrowser) {
                localStorage.setItem('auth_token', response.payload.token);
                localStorage.setItem(
                  'customer_data',
                  JSON.stringify(response.payload.customer)
                );
              }

              // Show success message
              Swal.fire({
                title: 'Registration Successful!',
                text: 'Your account has been created and you have been logged in.',
                icon: 'success',
                confirmButtonText: 'OK',
              }).then(() => {
                // Navigate to customer dashboard
                this.router.navigate(['/customer-view']);
              });
            } else {
              this.errorMessage = 'Invalid response from server';
              Swal.fire({
                title: 'Registration Successful',
                text: 'Your account has been created. Please log in manually.',
                icon: 'success',
                confirmButtonText: 'Go to Login',
              }).then(() => {
                this.router.navigate(['/login']);
              });
            }
          } else {
            // Registration succeeded but auto-login failed
            Swal.fire({
              title: 'Registration Successful',
              text: 'Your account has been created. Please log in manually.',
              icon: 'success',
              confirmButtonText: 'Go to Login',
            }).then(() => {
              this.router.navigate(['/login']);
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Auto-login error:', error);
          // Registration succeeded but auto-login failed
          Swal.fire({
            title: 'Registration Successful',
            text: 'Your account has been created. Please log in manually.',
            icon: 'success',
            confirmButtonText: 'Go to Login',
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
      });
  }
}
