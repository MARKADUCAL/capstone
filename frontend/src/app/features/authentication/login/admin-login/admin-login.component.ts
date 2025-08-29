import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

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

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    this.http
      .post(`${environment.apiUrl}/login_admin`, this.loginData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Login response:', response);

          if (response.status && response.status.remarks === 'success') {
            // Save token and admin data to localStorage if in browser
            if (this.isBrowser && response.payload && response.payload.token) {
              try {
                localStorage.setItem('admin_token', response.payload.token);
                localStorage.setItem(
                  'admin_data',
                  JSON.stringify(response.payload.admin)
                );
              } catch (err) {
                console.error('Error accessing localStorage:', err);
              }

              // Navigate to admin dashboard
              this.router.navigate(['/admin-view']);
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
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }
        },
      });
  }
}
