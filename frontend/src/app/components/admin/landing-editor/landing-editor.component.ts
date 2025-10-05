import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-landing-editor',
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
  templateUrl: './landing-editor.component.html',
  styleUrl: './landing-editor.component.css',
})
export class LandingEditorComponent implements OnInit {
  isSaving = false;
  validationResult: { isValid: boolean; errors: string[] } = {
    isValid: true,
    errors: [],
  };

  content: FrontendLandingPageContent = {
    heroTitle: '',
    heroDescription: '',
    heroBackgroundUrl: '',
    services: [],
    galleryImages: [],
    contactInfo: { address: '', openingHours: '', phone: '', email: '' },
    footer: {
      address: '',
      phone: '',
      email: '',
      copyright: '',
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
    },
  };

  constructor(
    private snackBar: MatSnackBar,
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
          response.status?.remarks === 'success' &&
          response.payload
        ) {
          this.content = this.landingPageService.convertToFrontendFormat(
            response.payload
          );
          this.updateValidation();
        } else {
          this.snackBar.open(
            'Failed to load content. Using empty defaults.',
            'Close',
            { duration: 3000 }
          );
          this.updateValidation();
        }
      },
      error: () => {
        this.snackBar.open(
          'Error loading content. Using empty defaults.',
          'Close',
          { duration: 3000 }
        );
        this.updateValidation();
      },
    });
  }

  addService(): void {
    this.content.services.push({ name: '', imageUrl: '' });
    this.updateValidation();
  }

  removeService(index: number): void {
    this.content.services.splice(index, 1);
    this.updateValidation();
  }

  addGalleryImage(): void {
    this.content.galleryImages.push({ url: '', alt: '' });
    this.updateValidation();
  }

  removeGalleryImage(index: number): void {
    this.content.galleryImages.splice(index, 1);
    this.updateValidation();
  }

  onContentChange(): void {
    this.updateValidation();
  }

  private updateValidation(): void {
    this.validationResult = this.validateContent();
  }

  validateContent(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.content.heroTitle?.trim()) errors.push('Hero title is required');
    if (!this.content.heroDescription?.trim())
      errors.push('Hero description is required');
    if (!this.content.heroBackgroundUrl?.trim())
      errors.push('Hero background image is required');

    if (!this.content.services || this.content.services.length === 0) {
      errors.push('At least one service is required');
    } else {
      this.content.services.forEach((s, i) => {
        if (!s.name?.trim()) errors.push(`Service ${i + 1} name is required`);
        if (!s.imageUrl?.trim())
          errors.push(`Service ${i + 1} image is required`);
      });
    }

    if (!this.content.contactInfo?.address?.trim())
      errors.push('Contact address is required');
    if (!this.content.contactInfo?.phone?.trim())
      errors.push('Contact phone is required');
    if (!this.content.contactInfo?.email?.trim())
      errors.push('Contact email is required');

    return { isValid: errors.length === 0, errors };
  }

  saveChanges(): void {
    if (this.isSaving) return;

    const validation = this.validateContent();
    if (!validation.isValid) {
      this.snackBar.open(
        'Please fix validation errors before saving.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.isSaving = true;
    const backendContent = this.landingPageService.convertToBackendFormat(
      this.content as any
    );
    this.landingPageService.updateLandingPageContent(backendContent).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res && (res as any).status?.remarks === 'success') {
          this.snackBar.open('Landing page saved successfully.', 'Close', {
            duration: 3000,
          });
        } else {
          this.snackBar.open(
            'Some sections may not have saved. Please retry.',
            'Close',
            { duration: 4000 }
          );
        }
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to save. Please try again.', 'Close', {
          duration: 4000,
        });
      },
    });
  }
}
