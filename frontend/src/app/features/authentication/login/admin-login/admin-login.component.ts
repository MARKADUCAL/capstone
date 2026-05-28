import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  host: { ngSkipHydration: 'true' },
})
export class AdminLoginComponent {
  loginData = {
    email: '',
    password: '',
  };
  errorMessage = '';
  isLoading = false;
  isBrowser: boolean;
  showPassword = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
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

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    this.http
      .post(`${environment.apiUrl}/login_admin`, this.loginData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Login response:', response);

          const token = response?.payload?.token;

          if (response?.status?.remarks === 'success' && typeof token === 'string' && token.trim()) {
            if (this.isBrowser) {
              try {
                localStorage.setItem('admin_token', token);
                localStorage.setItem('user_role', 'admin');
                localStorage.setItem(
                  'admin_data',
                  JSON.stringify(response.payload.admin)
                );
              } catch (err) {
                console.error('Error accessing localStorage:', err);
              }

              Swal.fire({
                title: 'Login Successful!',
                text: 'Welcome back!',
                icon: 'success',
                confirmButtonText: 'OK',
              }).then(() => {
                this.router.navigate(['/admin-view/dashboard']);
              });
            } else {
              this.errorMessage = 'Invalid browser session';
            }
          } else {
            const errorMessage = response.status?.message || 'Login failed';
            this.errorMessage = errorMessage;

            // Show error message
            Swal.fire({
              title: 'Login Failed!',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);

          let errorMessage = '';
          if (error.error?.status?.message) {
            errorMessage = error.error.status.message;
          } else if (error.status === 0) {
            errorMessage =
              'Cannot connect to server. Please check your connection.';
          } else {
            errorMessage = 'Login failed. Please try again.';
          }

          // Show error message
          Swal.fire({
            title: 'Login Failed!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
          });

          this.errorMessage = errorMessage;
        },
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
