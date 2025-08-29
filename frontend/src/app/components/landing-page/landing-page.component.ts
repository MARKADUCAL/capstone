import { Component, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ContactService, ContactForm } from '../../services/contact.service';

@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnDestroy {
  mobileMenuOpen = false;
  showModal = false;

  // Contact form properties
  contactForm: ContactForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };

  isSubmitting = false;
  showVerificationModal = false;
  verificationCode = '';
  verificationEmail = '';
  contactSuccessMessage = '';
  contactErrorMessage = '';
  isEmailVerified = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private contactService: ContactService
  ) {}

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.toggleBodyScroll();
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.toggleBodyScroll();
  }

  private toggleBodyScroll() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  ngOnDestroy() {
    // Restore body scroll when component is destroyed
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  onBookNowClick() {
    this.showModal = true;
  }

  confirmBooking() {
    this.showModal = false;
    this.router.navigate(['/customer']);
  }

  cancelBooking() {
    this.showModal = false;
  }

  // Contact form methods
  onSubmitContactForm() {
    this.contactErrorMessage = '';
    this.contactSuccessMessage = '';

    // Validate form
    if (!this.validateContactForm()) {
      return;
    }

    // Check if email is Gmail
    if (!this.contactService.verifyGmailFormat(this.contactForm.email)) {
      this.contactErrorMessage =
        'Please use a valid Gmail address (@gmail.com)';
      return;
    }

    // Show verification modal
    this.verificationEmail = this.contactForm.email;
    this.showVerificationModal = true;
  }

  validateContactForm(): boolean {
    if (!this.contactForm.name.trim()) {
      this.contactErrorMessage = 'Please enter your name';
      return false;
    }
    if (!this.contactForm.email.trim()) {
      this.contactErrorMessage = 'Please enter your email';
      return false;
    }
    if (!this.contactForm.subject.trim()) {
      this.contactErrorMessage = 'Please enter a subject';
      return false;
    }
    if (!this.contactForm.message.trim()) {
      this.contactErrorMessage = 'Please enter your message';
      return false;
    }
    return true;
  }

  sendVerificationCode() {
    this.contactService.sendVerificationEmail(this.verificationEmail).subscribe(
      (success) => {
        if (success) {
          this.contactErrorMessage = '';
          // In a real app, you would show a message that verification code was sent
        }
      },
      (error) => {
        this.contactErrorMessage =
          'Failed to send verification code. Please try again.';
      }
    );
  }

  verifyCode() {
    if (!this.verificationCode.trim()) {
      this.contactErrorMessage = 'Please enter the verification code';
      return;
    }

    // For demo purposes, accept any 6-digit code
    if (this.verificationCode.length === 6) {
      this.isEmailVerified = true;
      this.showVerificationModal = false;
      this.submitContactForm();
    } else {
      this.contactErrorMessage = 'Invalid verification code. Please try again.';
    }
  }

  submitContactForm() {
    this.isSubmitting = true;
    this.contactErrorMessage = '';

    this.contactService.submitContactForm(this.contactForm).subscribe(
      (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.contactSuccessMessage =
            'Thank you! Your message has been sent successfully.';
          this.resetContactForm();
        } else {
          this.contactErrorMessage =
            response.message || 'Failed to send message. Please try again.';
        }
      },
      (error) => {
        this.isSubmitting = false;
        this.contactErrorMessage =
          error.message || 'Failed to send message. Please try again.';
      }
    );
  }

  resetContactForm() {
    this.contactForm = {
      name: '',
      email: '',
      subject: '',
      message: '',
    };
    this.isEmailVerified = false;
    this.verificationCode = '';
  }

  closeVerificationModal() {
    this.showVerificationModal = false;
    this.verificationCode = '';
    this.isEmailVerified = false;
  }
}
