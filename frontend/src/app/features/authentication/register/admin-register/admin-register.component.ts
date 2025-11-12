import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-register.component.html',
  styleUrl: './admin-register.component.css',
  host: { ngSkipHydration: 'true' },
})
export class AdminRegisterComponent implements OnInit {
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
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.prefillNextAdminId();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private prefillNextAdminId(): void {
    this.http.get<any>(`${environment.apiUrl}/get_all_admins`).subscribe({
      next: (response) => {
        const admins = response?.payload?.admins || [];
        const usedNumbers = new Set<number>();

        for (const admin of admins) {
          const numeric =
            typeof admin.id === 'number' && admin.id > 0
              ? admin.id
              : this.parseAdminIdNumber(admin.admin_id);
          if (numeric > 0) {
            usedNumbers.add(numeric);
          }
        }

        let candidate = 1;
        while (usedNumbers.has(candidate)) {
          candidate += 1;
        }

        this.admin.admin_id = this.formatAdminId(candidate);
      },
      error: () => {
        if (!this.admin.admin_id) {
          this.admin.admin_id = this.formatAdminId(1);
        }
      },
    });
  }

  private parseAdminIdNumber(adminId: string): number {
    if (!adminId || typeof adminId !== 'string') {
      return 0;
    }

    const match = adminId.match(/ADM-(\d{1,})$/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  private formatAdminId(n: number): string {
    return `ADM-${n.toString().padStart(3, '0')}`;
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

    if (this.admin.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      this.isLoading = false;
      return;
    }

    if (!/^\d{11}$/.test(this.admin.phone)) {
      this.errorMessage = 'Phone number must be exactly 11 digits';
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
      // admin_id generated on the client to satisfy backend requirement
      // admin_key removed from data
    };

    console.log('Sending registration data to API:', {
      ...registrationData,
      admin_id: registrationData.admin_id,
      password: '[REDACTED]',
    });

    // Step 1: request a verification code
    this.http
      .post(
        `${environment.apiUrl}/send_registration_code`,
        { email: this.admin.email },
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
            .post(`${environment.apiUrl}/register_admin`, payload, {
              headers: { 'Content-Type': 'application/json' },
            })
            .subscribe({
              next: (response: any) => {
                this.isLoading = false;
                console.log('Response:', response);
                if (response.status.remarks === 'success') {
                  // Show success message before redirecting (only if in browser)
                  if (this.isBrowser) {
                    try {
                      Swal.fire({
                        title: 'Registration Submitted!',
                        text: 'Your account is pending approval by a super admin. You will be able to sign in once approved.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                      }).then(() => {
                        this.router.navigate(['/admin-login']);
                      });
                    } catch (err) {
                      console.error('Error with browser API:', err);
                      this.router.navigate(['/admin-login']);
                    }
                  } else {
                    this.router.navigate(['/admin-login']);
                  }
                } else {
                  const errorMessage =
                    response.status.message || 'Registration failed';
                  this.errorMessage = errorMessage;

                  // Show error message
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
}
