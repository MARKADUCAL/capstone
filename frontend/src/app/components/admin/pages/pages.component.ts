import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import {
  LandingPageService,
  ApiResponse,
  LandingPageContent,
} from '../../../services/landing-page.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface Service {
  name: string;
  imageUrl: string;
}

interface ContactInfo {
  address: string;
  openingHours: string;
  phone: string;
  email: string;
}

interface GalleryImage {
  url: string;
  alt: string;
}

interface FrontendLandingPageContent {
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
}

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.css',
})
export class PagesComponent implements OnInit {
  private readonly STORAGE_KEY = 'landingPageContent';
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

  constructor(
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    private landingPageService: LandingPageService
  ) {}

  ngOnInit(): void {
    // Load any locally saved draft first (no-DB mode)
    const localDraft = this.loadFromLocalStorage();
    if (localDraft) {
      this.content = localDraft;
      console.log('Loaded landing page draft from localStorage.');
    }
    this.loadLandingPageContent();
  }

  loadLandingPageContent(): void {
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
          console.log(
            'Landing page content loaded successfully:',
            this.content
          );
        } else {
          console.warn(
            'Failed to load landing page content:',
            response?.status?.message || 'No response received'
          );
          // Fallback to localStorage if present
          const local = this.loadFromLocalStorage();
          if (local) {
            this.content = local;
            this.snackBar.open(
              'Loaded content from your browser (no database connection).',
              'Close',
              { duration: 5000 }
            );
          } else {
            this.snackBar.open(
              'Using default content. Database not connected. Your edits will be saved locally.',
              'Close',
              { duration: 7000 }
            );
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading landing page content:', error);
        const local = this.loadFromLocalStorage();
        if (local) {
          this.content = local;
          this.snackBar.open(
            'Loaded content from your browser (no database connection).',
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            'Database connection failed. Your edits will be saved locally only.',
            'Close',
            { duration: 7000 }
          );
        }
      },
    });
  }

  addService(): void {
    this.content.services.push({ name: '', imageUrl: '' });
    this.onContentChange();
  }

  removeService(index: number): void {
    this.content.services.splice(index, 1);
    this.onContentChange();
  }

  addGalleryImage(): void {
    this.content.galleryImages.push({ url: '', alt: '' });
    this.onContentChange();
  }

  removeGalleryImage(index: number): void {
    this.content.galleryImages.splice(index, 1);
    this.onContentChange();
  }

  testRouting(): void {
    this.landingPageService.testRouting().subscribe({
      next: (response: ApiResponse<any> | null) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.snackBar.open('GET test successful!', 'Close', {
            duration: 3000,
          });
          console.log('GET test response:', response);
        } else {
          this.snackBar.open(
            'Routing test failed: ' +
              (response?.status?.message || 'No response'),
            'Close',
            {
              duration: 5000,
            }
          );
        }
      },
      error: (error: any) => {
        console.error('GET test error:', error);
        this.snackBar.open('GET test error: ' + error.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }

  testPostRouting(): void {
    this.landingPageService.testPostRouting().subscribe({
      next: (response: ApiResponse<any> | null) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.snackBar.open('POST test successful!', 'Close', {
            duration: 3000,
          });
          console.log('POST test response:', response);
        } else {
          this.snackBar.open(
            'POST test failed: ' + (response?.status?.message || 'No response'),
            'Close',
            {
              duration: 5000,
            }
          );
        }
      },
      error: (error: any) => {
        console.error('POST test error:', error);
        this.snackBar.open('POST test error: ' + error.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }

  saveChanges(): void {
    // Send section-by-section updates to improve compatibility with some hosts
    const heroPayload = {
      title: this.content.heroTitle,
      description: this.content.heroDescription,
      background_url: this.content.heroBackgroundUrl,
    };
    const servicesPayload = (this.content.services || []).map((s) => ({
      name: s.name,
      image_url: (s as any).image_url || s.imageUrl || '',
    }));
    const galleryPayload = this.content.galleryImages || [];
    const contactPayload = {
      address: this.content.contactInfo?.address || '',
      opening_hours: this.content.contactInfo?.openingHours || '',
      phone: this.content.contactInfo?.phone || '',
      email: this.content.contactInfo?.email || '',
    };
    const footerPayload = {
      address: this.content.footer?.address || '',
      phone: this.content.footer?.phone || '',
      email: this.content.footer?.email || '',
      copyright: this.content.footer?.copyright || '',
      facebook: this.content.footer?.facebook || '',
      instagram: this.content.footer?.instagram || '',
      twitter: this.content.footer?.twitter || '',
      tiktok: this.content.footer?.tiktok || '',
    };

    console.log('=== SAVE (SECTIONED) DEBUG ===');
    console.log('Hero:', heroPayload);
    console.log('Services:', servicesPayload);
    console.log('Gallery:', galleryPayload);
    console.log('Contact:', contactPayload);
    console.log('Footer:', footerPayload);

    const requests = {
      hero: this.landingPageService.updateSection('hero', heroPayload).pipe(
        catchError((e) => {
          console.error('Hero save error', e);
          return of(null);
        })
      ),
      services: this.landingPageService
        .updateSection('services', servicesPayload)
        .pipe(
          catchError((e) => {
            console.error('Services save error', e);
            return of(null);
          })
        ),
      gallery: this.landingPageService
        .updateSection('gallery', galleryPayload)
        .pipe(
          catchError((e) => {
            console.error('Gallery save error', e);
            return of(null);
          })
        ),
      contact_info: this.landingPageService
        .updateSection('contact_info', contactPayload)
        .pipe(
          catchError((e) => {
            console.error('Contact save error', e);
            return of(null);
          })
        ),
      footer: this.landingPageService
        .updateSection('footer', footerPayload)
        .pipe(
          catchError((e) => {
            console.error('Footer save error', e);
            return of(null);
          })
        ),
    };

    forkJoin(requests)
      .pipe(
        map((res) => {
          const keys = Object.keys(res);
          const successes = keys.filter(
            (k) =>
              (res as any)[k] && (res as any)[k].status?.remarks === 'success'
          );
          return { total: keys.length, ok: successes.length };
        })
      )
      .subscribe(({ total, ok }) => {
        if (ok === total) {
          this.snackBar.open('All changes saved successfully!', 'Close', {
            duration: 3000,
          });
        } else if (ok > 0) {
          this.snackBar.open(
            `${ok}/${total} sections saved. Some failed — please retry.`,
            'Close',
            { duration: 6000 }
          );
        } else {
          // Fallback: save locally so admin can continue editing without DB
          this.saveToLocalStorage();
          this.snackBar.open(
            'Could not reach API. Changes saved to your browser only.',
            'Close',
            { duration: 6000 }
          );
        }
      });
  }

  onHeroBackgroundSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Image size must be less than 5MB', 'Close', {
        duration: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.heroBackgroundUrl = result;
        this.onContentChange();
      }
    };
    reader.readAsDataURL(file);
  }

  // Image upload helpers
  onServiceImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Image size must be less than 5MB', 'Close', {
        duration: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.services[index].imageUrl = result;
        this.onContentChange();
      }
    };
    reader.readAsDataURL(file);
  }

  onGalleryImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Image size must be less than 5MB', 'Close', {
        duration: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.galleryImages[index].url = result;
        this.onContentChange();
      }
    };
    reader.readAsDataURL(file);
  }

  private loadFromLocalStorage(): FrontendLandingPageContent | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed as FrontendLandingPageContent;
    } catch (e) {
      console.warn('Failed to read local landing page draft:', e);
      return null;
    }
  }

  private saveToLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.content));
      console.log('Saved landing page draft to localStorage.');
    } catch (e) {
      console.warn('Failed to save landing page draft locally:', e);
    }
  }

  getPreviewUrl(): string {
    // Save current content to localStorage for preview
    this.saveToLocalStorage();
    // Return the landing page URL with a timestamp to force refresh
    return `/landing-page?preview=${Date.now()}`;
  }

  // Auto-save functionality
  onContentChange(): void {
    // Save to localStorage whenever content changes for real-time preview
    this.saveToLocalStorage();
  }

  // Validation methods
  validateContent(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.content.heroTitle?.trim()) {
      errors.push('Hero title is required');
    }

    if (!this.content.heroDescription?.trim()) {
      errors.push('Hero description is required');
    }

    if (!this.content.heroBackgroundUrl?.trim()) {
      errors.push('Hero background image is required');
    }

    if (!this.content.services || this.content.services.length === 0) {
      errors.push('At least one service is required');
    } else {
      this.content.services.forEach((service, index) => {
        if (!service.name?.trim()) {
          errors.push(`Service ${index + 1} name is required`);
        }
        if (!service.imageUrl?.trim()) {
          errors.push(`Service ${index + 1} image is required`);
        }
      });
    }

    if (!this.content.contactInfo?.address?.trim()) {
      errors.push('Contact address is required');
    }

    if (!this.content.contactInfo?.phone?.trim()) {
      errors.push('Contact phone is required');
    }

    if (!this.content.contactInfo?.email?.trim()) {
      errors.push('Contact email is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
