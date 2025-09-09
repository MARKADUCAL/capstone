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
        } else {
          console.warn(
            'Failed to load landing page content:',
            response?.status?.message || 'No response received'
          );
          // Keep default content if loading fails
          this.snackBar.open(
            'Using default content. Please set up the database to enable content management.',
            'Close',
            { duration: 5000 }
          );
        }
      },
      error: (error: any) => {
        console.error('Error loading landing page content:', error);
        this.snackBar.open(
          'Database not set up. Please run the SQL script to create the required tables.',
          'Close',
          { duration: 7000 }
        );
        // Keep default content if loading fails
      },
    });
  }

  addService(): void {
    this.content.services.push({ name: '', imageUrl: '' });
  }

  removeService(index: number): void {
    this.content.services.splice(index, 1);
  }

  addGalleryImage(): void {
    this.content.galleryImages.push({ url: '', alt: '' });
  }

  removeGalleryImage(index: number): void {
    this.content.galleryImages.splice(index, 1);
  }

  testRouting(): void {
    this.landingPageService.testRouting().subscribe({
      next: (response: ApiResponse<any> | null) => {
        if (response && response.status && response.status.remarks === 'success') {
          this.snackBar.open('Routing test successful!', 'Close', {
            duration: 3000,
          });
          console.log('Routing test response:', response);
        } else {
          this.snackBar.open('Routing test failed: ' + (response?.status?.message || 'No response'), 'Close', {
            duration: 5000,
          });
        }
      },
      error: (error: any) => {
        console.error('Routing test error:', error);
        this.snackBar.open('Routing test error: ' + error.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }

  saveChanges(): void {
    const backendContent = this.landingPageService.convertToBackendFormat(
      this.content
    );

    console.log('Sending data to backend:', backendContent);

    this.landingPageService.updateLandingPageContent(backendContent).subscribe({
      next: (response: ApiResponse<any> | null) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          this.snackBar.open('Changes saved successfully!', 'Close', {
            duration: 3000,
          });
        } else {
          this.snackBar.open(
            'Failed to save changes: ' +
              (response?.status?.message ||
                'No response received. Please check if database tables exist.'),
            'Close',
            {
              duration: 7000,
            }
          );
        }
      },
      error: (error: any) => {
        console.error('Error saving landing page content:', error);
        this.snackBar.open(
          'Database not set up. Please run the SQL script to create the required tables.',
          'Close',
          {
            duration: 7000,
          }
        );
      },
    });
  }

  onHeroBackgroundSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.heroBackgroundUrl = result;
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.services[index].imageUrl = result;
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.content.galleryImages[index].url = result;
      }
    };
    reader.readAsDataURL(file);
  }
}
