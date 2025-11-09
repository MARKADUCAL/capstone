import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ForgotPasswordService } from '../../../../services/forgot-password.service';

@Component({
  selector: 'app-customer-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-forgot-password.component.html',
  styleUrl: './customer-forgot-password.component.css',
})
export class CustomerForgotPasswordComponent implements OnInit {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showVerificationForm = false;
  showResetForm = false;
  resetToken = '';
  verificationCode = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private forgotPasswordService: ForgotPasswordService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if we have a token in the URL (for password reset)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.resetToken = token;
      this.showResetForm = true;
    }
  }

  onSubmitRequest() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      this.isLoading = false;
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    this.forgotPasswordService
      .requestPasswordResetCustomer(this.email)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status.remarks === 'success') {
            this.successMessage = 'Verification code has been sent to your email. Please check your inbox.';
            // Store the reset token for verification
            if (response.payload?.reset_token) {
              this.resetToken = response.payload.reset_token;
              this.showVerificationForm = true;
            }
          } else {
            this.errorMessage = response.status.message;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Forgot password error:', error);
          if (error.error?.status?.message) {
            this.errorMessage = error.error.status.message;
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
        },
      });
  }

  onVerifyCode() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.verificationCode) {
      this.errorMessage = 'Please enter the verification code';
      return;
    }

    // Verify the code matches the reset token
    if (this.verificationCode === this.resetToken) {
      this.showVerificationForm = false;
      this.showResetForm = true;
      this.successMessage = 'Verification successful! Please enter your new password.';
    } else {
      this.errorMessage = 'Invalid verification code. Please try again.';
    }
  }

  onSubmitReset() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      this.isLoading = false;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      this.isLoading = false;
      return;
    }

    this.forgotPasswordService
      .resetPassword(this.resetToken, this.newPassword)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status?.remarks === 'success') {
            this.successMessage =
              'Password has been reset successfully! You can now log in with your new password.';
            setTimeout(() => {
              this.router.navigate(['/customer-login']);
            }, 3000);
          } else {
            this.errorMessage =
              response.status?.message || 'Failed to reset password';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Reset password error:', error);
          if (error.error?.status?.message) {
            this.errorMessage = error.error.status.message;
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
        },
      });
  }

  goBackToLogin() {
    this.router.navigate(['/customer-login']);
  }
}
