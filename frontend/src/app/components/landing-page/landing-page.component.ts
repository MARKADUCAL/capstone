import {
  Component,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  OnInit,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContactService, ContactForm } from '../../services/contact.service';
type Service = { name: string; imageUrl: string };
type GalleryImage = { url: string; alt: string };
type ContactInfo = {
  address: string;
  openingHours: string;
  phone: string;
  email: string;
};
type LandingPageContent = {
  heroTitle: string;
  heroDescription: string;
  heroBackgroundUrl: string;
  services: Service[];
  galleryImages: GalleryImage[];
  contactInfo: ContactInfo;
  footer: {
    address: string;
    phone: string;
    email: string;
    copyright: string;
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
  };
};

@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnInit, OnDestroy {
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

  // Dynamic content (editable via admin pages)
  content: LandingPageContent = {
    heroTitle: 'CARWASHING MADE EASY',
    heroDescription:
      'AutoWash Hub is one of the most convenient indoor, in-bay, and outdoor carwash specialists offering quality services including body wash, interior vacuum, and more.',
    heroBackgroundUrl: 'assets/homebackground.png',
    services: [
      { name: 'BASIC CAR WASH', imageUrl: 'assets/basiccarwash.png' },
      { name: 'TIRE BLACK', imageUrl: 'assets/tireblack.png' },
      { name: 'BODY WAX', imageUrl: 'assets/bodywax.png' },
      { name: 'VACUUM', imageUrl: 'assets/vacuum.png' },
    ],
    galleryImages: [
      { url: 'assets/car1.png', alt: 'Car 1' },
      { url: 'assets/car2.png', alt: 'Car 2' },
      { url: 'assets/car3.png', alt: 'Car 3' },
      { url: 'assets/car4.png', alt: 'Car 4' },
      { url: 'assets/car5.png', alt: 'Car 5' },
      { url: 'assets/car6.png', alt: 'Car 6' },
    ],
    contactInfo: {
      address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      openingHours: 'MON - FRI, 8:00am - 9:00pm',
      phone: '09123456789',
      email: 'Example123email.com',
    },
    footer: {
      address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      phone: '09123456789',
      email: 'info@autowashhub.com',
      copyright:
        'AutoWash Hub © 2025. All rights reserved. | Privacy Policy | Terms of Service',
      facebook: '#',
      instagram: '#',
      twitter: '#',
      tiktok: '#',
    },
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('landingPageContent');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          this.content = {
            heroTitle: parsed.heroTitle ?? this.content.heroTitle,
            heroDescription:
              parsed.heroDescription ?? this.content.heroDescription,
            heroBackgroundUrl:
              parsed.heroBackgroundUrl ?? this.content.heroBackgroundUrl,
            services: Array.isArray(parsed.services)
              ? parsed.services
              : this.content.services,
            galleryImages: Array.isArray(parsed.galleryImages)
              ? parsed.galleryImages
              : this.content.galleryImages,
            contactInfo: {
              address:
                parsed.contactInfo?.address ?? this.content.contactInfo.address,
              openingHours:
                parsed.contactInfo?.openingHours ??
                this.content.contactInfo.openingHours,
              phone:
                parsed.contactInfo?.phone ?? this.content.contactInfo.phone,
              email:
                parsed.contactInfo?.email ?? this.content.contactInfo.email,
            },
            footer: {
              address: parsed.footer?.address ?? this.content.footer.address,
              phone: parsed.footer?.phone ?? this.content.footer.phone,
              email: parsed.footer?.email ?? this.content.footer.email,
              copyright:
                parsed.footer?.copyright ?? this.content.footer.copyright,
              facebook: parsed.footer?.facebook ?? this.content.footer.facebook,
              instagram:
                parsed.footer?.instagram ?? this.content.footer.instagram,
              twitter: parsed.footer?.twitter ?? this.content.footer.twitter,
              tiktok: parsed.footer?.tiktok ?? this.content.footer.tiktok,
            },
          };
        } catch {
          // ignore malformed storage
        }
      }
    }
  }

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
