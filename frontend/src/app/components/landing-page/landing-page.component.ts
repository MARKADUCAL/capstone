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
import { HttpClient } from '@angular/common/http';

import { ContactService, ContactForm } from '../../services/contact.service';
import {
  LandingPageService,
  ApiResponse,
  LandingPageContent,
} from '../../services/landing-page.service';
import { environment } from '../../../environments/environment';
type Service = { name: string; imageUrl: string };
type GalleryImage = { url: string; alt: string };
type ContactInfo = {
  address: string;
  openingHours: string;
  phone: string;
  email: string;
};
type FrontendLandingPageContent = {
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

interface PricingEntry {
  id: number;
  vehicle_type: string;
  service_package: string;
  price: number;
  is_active: boolean;
}

interface PricingMatrix {
  [vehicleType: string]: { [servicePackage: string]: number };
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'landingPageContent';
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

  // Pricing data properties
  loading: boolean = false;
  pricingError: string = '';
  pricingMatrix: PricingMatrix = {};
  pricingEntries: PricingEntry[] = [];

  // Services data properties
  servicesLoading: boolean = false;
  servicesError: string = '';
  services: Service[] = [];

  // Vehicle types and service packages are derived from DB pricing
  vehicleTypes: { code: string; description: string }[] = [];
  servicePackages: { code: string; description: string }[] = [];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private contactService: ContactService,
    private landingPageService: LandingPageService,
    private http: HttpClient
  ) {}

  // Dynamic content (editable via admin pages)
  content: FrontendLandingPageContent = {
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
    // Only fetch on the client to avoid SSR build-time API calls
    if (isPlatformBrowser(this.platformId)) {
      this.loadLandingPageContent();
      this.loadPricingData();
      this.loadServicesData();
    }
  }

  loadLandingPageContent() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.landingPageService.getLandingPageContent().subscribe({
      next: (response: ApiResponse<LandingPageContent> | null) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success' &&
          response.payload
        ) {
          const backendContent = response.payload;
          this.content =
            this.landingPageService.convertToFrontendFormat(backendContent);
          // Clear old cache and save fresh data
          this.clearLocalStorageCache();
          this.saveToLocalStorage();
          console.log(
            'Landing page content loaded from API and cache updated.'
          );
        } else {
          console.warn(
            'Failed to load landing page content from API:',
            response?.status?.message || 'No response received'
          );
          // Try localStorage as fallback
          this.loadFromLocalStorageFallback();
        }
      },
      error: (error: any) => {
        console.error('Error loading landing page content from API:', error);
        // Try localStorage as fallback
        this.loadFromLocalStorageFallback();
      },
    });
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
    // Directly submit without Gmail-only check or verification
    this.submitContactForm();
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
    // Verification no longer required; keep method as no-op to avoid breaking references
    this.contactErrorMessage = '';
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

  private loadFromLocalStorage(): FrontendLandingPageContent | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as FrontendLandingPageContent;
    } catch (e) {
      return null;
    }
  }

  private loadFromLocalStorageFallback(): void {
    const local = this.loadFromLocalStorage();
    if (local) {
      this.content = local;
      console.log('Landing page content loaded from localStorage as fallback.');
    } else {
      console.log('No cached content available, using default content.');
    }
  }

  private saveToLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.content));
    } catch (e) {}
  }

  private clearLocalStorageCache(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log(
        'Cleared localStorage cache to ensure fresh data from database.'
      );
    } catch (e) {
      console.warn('Failed to clear localStorage cache:', e);
    }
  }

  // Public method to force refresh content (useful for debugging)
  public forceRefreshContent(): void {
    console.log('Force refreshing landing page content...');
    this.clearLocalStorageCache();
    this.loadLandingPageContent();
  }

  // Pricing methods
  loadPricingData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading = true;
    this.pricingError = '';

    // Load pricing from database
    this.http.get<any>(`${environment.apiUrl}/get_pricing_matrix`).subscribe({
      next: (response) => {
        if (response.status && response.status.remarks === 'success') {
          this.pricingMatrix = response.payload.pricing_matrix || {};
          console.log('Loaded pricing matrix:', this.pricingMatrix);
          this.deriveVehicleTypesAndPackages();
        } else {
          console.error('Failed to load pricing matrix:', response);
          this.pricingMatrix = {};
          this.pricingError =
            response?.status?.message || 'Failed to load pricing matrix.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pricing matrix:', error);
        this.pricingMatrix = {};
        this.pricingError = 'Unable to load pricing data. Please try again.';
        this.loading = false;
      },
    });
  }

  private deriveVehicleTypesAndPackages(): void {
    // Derive vehicle types from pricing matrix keys
    const vehicleCodes = Object.keys(this.pricingMatrix || {});
    this.vehicleTypes = vehicleCodes.map((code) => ({
      code,
      description: this.describeVehicleType(code),
    }));

    // Derive union of service packages across vehicle types (use keys as-is)
    const pkgSet = new Set<string>();
    for (const vehicleCode of vehicleCodes) {
      const entries = this.pricingMatrix[vehicleCode] || {};
      Object.keys(entries).forEach((pkg) => pkgSet.add(pkg));
    }

    // Provide a stable order: p1, p1_5, p2, p3, p4, then others, or if numeric: 1,1.5,2,3,4
    const preferredOrder = [
      'p1',
      'p1_5',
      'p2',
      'p3',
      'p4',
      '1',
      '1.5',
      '2',
      '3',
      '4',
    ];
    const presentPreferred = preferredOrder.filter((p) => pkgSet.has(p));
    const remaining = Array.from(pkgSet).filter(
      (p) => !presentPreferred.includes(p)
    );
    const ordered = [...presentPreferred, ...remaining];

    const pkgDescriptions: { [key: string]: string } = {
      p1: 'Wash only',
      p1_5: 'Body Wash + Tire Black',
      p2: 'Wash / Vacuum',
      p3: 'Wash / Vacuum / Hand Wax',
      p4: 'Wash / Vacuum / Buffing Wax',
      '1': 'Wash only',
      '1.5': 'Body Wash + Tire Black',
      '2': 'Wash / Vacuum',
      '3': 'Wash / Vacuum / Hand Wax',
      '4': 'Wash / Vacuum / Buffing Wax',
    };

    this.servicePackages = ordered.map((code) => ({
      code,
      description: pkgDescriptions[code] || 'Car wash service',
    }));
  }

  private describeVehicleType(code: string): string {
    const map: { [key: string]: string } = {
      S: 'Sedans (all sedan types)',
      M: 'SUVs (all SUV types)',
      L: 'VANs (any type of van)',
      XL: 'Larger than vans (big SUVs/pickups, oversized vehicles)',
      XXL: 'Oversized vehicles',
    };
    return map[code] || code;
  }

  formatPrice(price: number | string | null | undefined): string {
    if (price === null || price === undefined) {
      return 'Price not set';
    }

    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numericPrice <= 0) {
      return 'Price not set';
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return 'Price not set';
    }

    return `₱${numericPrice.toFixed(2)}`;
  }

  isPriceAvailable(vehicleType: string, servicePackage: string): boolean {
    if (!this.pricingMatrix[vehicleType]) {
      return false;
    }

    const price = this.pricingMatrix[vehicleType][servicePackage];
    if (price === null || price === undefined) {
      return false;
    }

    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    return !isNaN(numericPrice) && numericPrice > 0;
  }

  // Provide price for template binding
  getPrice(vehicleType: string, servicePackage: string): number | null {
    const price = this.pricingMatrix?.[vehicleType]?.[servicePackage];
    if (price === null || price === undefined) return null;
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numericPrice) ? null : numericPrice;
  }

  navigateToAppointmentWithPackage(
    vehicleType: string,
    servicePackage: string
  ): void {
    this.router.navigate(['/customer'], {
      queryParams: {
        vehicle_type: vehicleType,
        service_package: servicePackage,
        price: this.getPrice(vehicleType, servicePackage) || 0,
      },
    });
  }

  // Services methods
  loadServicesData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.servicesLoading = true;
    this.servicesError = '';

    // Load service categories from database
    this.http
      .get<any>(`${environment.apiUrl}/get_service_categories`)
      .subscribe({
        next: (response) => {
          if (response.status && response.status.remarks === 'success') {
            // Convert service categories to services format
            this.services = response.payload.service_categories.map(
              (category: any) => ({
                name: category.name.toUpperCase(),
                imageUrl: this.getServiceImageUrl(category.name),
              })
            );
            console.log('Loaded services:', this.services);
          } else {
            console.error('Failed to load services:', response);
            this.services = this.getDefaultServices();
          }
          this.servicesLoading = false;
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.services = this.getDefaultServices();
          this.servicesLoading = false;
        },
      });
  }

  private getServiceImageUrl(serviceName: string): string {
    // Map service names to image URLs
    const serviceImages: { [key: string]: string } = {
      'body wash': 'assets/basiccarwash.png',
      'tire black': 'assets/tireblack.png',
      'body wax': 'assets/bodywax.png',
      vacuum: 'assets/vacuum.png',
      'basic wash': 'assets/basiccarwash.png',
      'premium wash': 'assets/basiccarwash.png',
      'interior cleaning': 'assets/vacuum.png',
      'exterior wash': 'assets/basiccarwash.png',
    };

    const lowerName = serviceName.toLowerCase();
    for (const [key, imageUrl] of Object.entries(serviceImages)) {
      if (lowerName.includes(key)) {
        return imageUrl;
      }
    }

    // Default image if no match found
    return 'assets/basiccarwash.png';
  }

  private getDefaultServices(): Service[] {
    return [
      { name: 'BASIC CAR WASH', imageUrl: 'assets/basiccarwash.png' },
      { name: 'TIRE BLACK', imageUrl: 'assets/tireblack.png' },
      { name: 'BODY WAX', imageUrl: 'assets/bodywax.png' },
      { name: 'VACUUM', imageUrl: 'assets/vacuum.png' },
    ];
  }
}
