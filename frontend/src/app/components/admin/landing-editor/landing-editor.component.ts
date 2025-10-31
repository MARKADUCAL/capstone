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
import { HttpClient } from '@angular/common/http';
import { of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LandingPageService,
  ApiResponse,
  LandingPageContent,
} from '../../../services/landing-page.service';
import { environment } from '../../../../environments/environment';

type Service = { name: string; imageUrl: string };
type GalleryImage = {
  url: string;
  alt: string;
  selectedFile?: File;
  preview?: string;
  uploadError?: string;
  uploadSuccess?: string;
};
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

  // Image upload properties
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadError: string = '';
  uploadSuccess: string = '';

  // Gallery upload properties
  isUploadingGallery: boolean[] = [];

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
    private landingPageService: LandingPageService,
    private http: HttpClient
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
          // Normalize any legacy query-style file URLs to clean path style
          const normalize = (url: string | undefined | null): string => {
            if (!url) return '';
            const val = String(url);
            const match = val.match(/index\.php\?request=file\/([^&#]+)/);
            if (match && match[1]) {
              const base = val
                .split('/index.php?request=file/')[0]
                .replace(/\/$/, '');
              return `${base}/file/${match[1]}`;
            }
            return val;
          };
          this.content.heroBackgroundUrl = normalize(
            this.content.heroBackgroundUrl
          );
          this.content.galleryImages = (this.content.galleryImages || []).map(
            (g) => ({
              ...g,
              url: normalize(g.url),
            })
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
    this.isUploadingGallery.push(false);
    this.updateValidation();
  }

  removeGalleryImage(index: number): void {
    this.content.galleryImages.splice(index, 1);
    this.isUploadingGallery.splice(index, 1);
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
      errors.push('Hero background image is required - please upload an image');

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

  private clearLandingPageCache(): void {
    try {
      localStorage.removeItem('landingPageContent');
      console.log('Cleared landing page cache after successful save.');
    } catch (error) {
      console.warn('Failed to clear landing page cache:', error);
    }
  }

  private reloadContent(): void {
    this.loadLandingPageContent();
  }

  // Image upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 5MB.';
        return;
      }

      this.selectedFile = file;
      this.uploadError = '';
      this.uploadSuccess = '';

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select an image file first.';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('category', 'hero_background');

    this.http
      .post<any>(`${environment.apiUrl}/upload_file`, formData)
      .subscribe({
        next: (response) => {
          console.log('Upload response:', response);
          this.isUploading = false;
          if (response.status === 'success') {
            this.uploadSuccess = 'Image uploaded successfully!';
            console.log('Upload URL:', response.data?.url);
            this.content.heroBackgroundUrl = response.data.url;
            this.updateValidation(); // Update validation after successful upload

            // Automatically save the hero background to database
            this.saveHeroBackgroundToDatabase();

            this.clearUploadForm();
            this.snackBar.open(
              'Hero background image updated and saved!',
              'Close',
              {
                duration: 3000,
              }
            );
          } else {
            this.uploadError =
              response.message || 'Upload failed. Please try again.';
          }
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadError = 'Upload failed. Please try again.';
          console.error('Upload error:', error);
        },
      });
  }

  clearUploadForm(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadError = '';
    this.uploadSuccess = '';
  }

  removeImagePreview(): void {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  private saveHeroBackgroundToDatabase(): void {
    const heroPayload = {
      title: this.content.heroTitle,
      description: this.content.heroDescription,
      background_url: this.content.heroBackgroundUrl,
    };

    this.landingPageService.updateSection('hero', heroPayload).subscribe({
      next: (response) => {
        if (response.status && response.status.remarks === 'success') {
          console.log('Hero background saved to database successfully');
          // Clear the landing page cache so it loads fresh data
          this.clearLandingPageCache();
        } else {
          console.warn(
            'Failed to save hero background to database:',
            response.status?.message
          );
        }
      },
      error: (error) => {
        console.error('Error saving hero background to database:', error);
      },
    });
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
    this.landingPageService
      .updateLandingPageContent(backendContent)
      .pipe(
        catchError((e) => {
          console.error('Bulk save error — falling back to section saves', e);
          return of(null);
        })
      )
      .subscribe((bulkRes) => {
        if (bulkRes && (bulkRes as any).status?.remarks === 'success') {
          this.isSaving = false;
          this.clearLandingPageCache();
          this.reloadContent();
          this.snackBar.open(
            'All changes saved successfully to database!',
            'Close',
            { duration: 3000 }
          );
          return;
        }

        const stripDataUrl = (val: string | undefined | null): string => {
          if (!val) return '';
          return val.startsWith('data:') ? '' : val;
        };

        const heroPayload = {
          title: this.content.heroTitle,
          description: this.content.heroDescription,
          background_url: stripDataUrl(this.content.heroBackgroundUrl),
        };
        const servicesPayload = (this.content.services || []).map((s) => ({
          name: s.name,
          image_url: stripDataUrl((s as any).image_url || s.imageUrl || ''),
        }));
        const galleryPayload = (this.content.galleryImages || []).map((g) => ({
          url: stripDataUrl(g.url),
          alt: g.alt,
        }));
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
                  (res as any)[k] &&
                  (res as any)[k].status?.remarks === 'success'
              );
              return { total: keys.length, ok: successes.length };
            })
          )
          .subscribe({
            next: ({ total, ok }) => {
              this.isSaving = false;
              if (ok === total) {
                this.clearLandingPageCache();
                this.reloadContent();
                this.snackBar.open(
                  'All changes saved successfully to database!',
                  'Close',
                  { duration: 3000 }
                );
              } else if (ok > 0) {
                this.snackBar.open(
                  `${ok}/${total} sections saved. Some failed — please retry.`,
                  'Close',
                  { duration: 6000 }
                );
              } else {
                this.snackBar.open(
                  'Failed to save to database. Please try again.',
                  'Close',
                  { duration: 6000 }
                );
              }
            },
            error: (error) => {
              this.isSaving = false;
              console.error('Save error:', error);
              this.snackBar.open(
                'Failed to save to database. Please try again.',
                'Close',
                { duration: 6000 }
              );
            },
          });
      });
  }

  // Gallery file upload methods
  onGalleryFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.content.galleryImages[index].uploadError =
          'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.content.galleryImages[index].uploadError =
          'File size must be less than 5MB.';
        return;
      }

      this.content.galleryImages[index].selectedFile = file;
      this.content.galleryImages[index].uploadError = '';
      this.content.galleryImages[index].uploadSuccess = '';

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.content.galleryImages[index].preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadGalleryImage(index: number): void {
    const image = this.content.galleryImages[index];
    if (!image.selectedFile) {
      image.uploadError = 'Please select an image file first.';
      return;
    }

    this.isUploadingGallery[index] = true;
    image.uploadError = '';
    image.uploadSuccess = '';

    const formData = new FormData();
    formData.append('file', image.selectedFile);
    formData.append('category', 'gallery');

    this.http
      .post<any>(`${environment.apiUrl}/upload_file`, formData)
      .subscribe({
        next: (response) => {
          console.log('Gallery upload response:', response);
          this.isUploadingGallery[index] = false;
          if (response.status === 'success') {
            image.uploadSuccess = 'Image uploaded successfully!';
            console.log('Gallery upload URL:', response.data?.url);
            image.url = response.data.url;
            this.updateValidation();

            // Clear upload form
            this.clearGalleryUpload(index);

            this.snackBar.open(
              `Gallery image ${index + 1} uploaded successfully!`,
              'Close',
              { duration: 3000 }
            );
          } else {
            image.uploadError =
              response.message || 'Upload failed. Please try again.';
          }
        },
        error: (error) => {
          this.isUploadingGallery[index] = false;
          image.uploadError = 'Upload failed. Please try again.';
          console.error('Gallery upload error:', error);
        },
      });
  }

  clearGalleryUpload(index: number): void {
    this.content.galleryImages[index].selectedFile = undefined;
    this.content.galleryImages[index].preview = undefined;
    this.content.galleryImages[index].uploadError = '';
    this.content.galleryImages[index].uploadSuccess = '';
  }

  removeGalleryPreview(index: number): void {
    this.content.galleryImages[index].preview = undefined;
    this.content.galleryImages[index].selectedFile = undefined;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const currentSrc = img?.src || '';
    console.error('Image failed to load:', currentSrc);

    // Prevent infinite swap loops
    const attempts = Number((img as any).dataset?.attempts || 0);
    if (attempts > 2) return;

    const apiBase = environment.apiUrl.replace(/\/$/, '');
    let nextSrc = '';

    const cleanMatch = currentSrc.match(/\/api\/file\/([^/?#]+)$/);
    const queryMatch = currentSrc.match(/\/api\/index\.php\?request=file\/([^&#]+)/);

    if (cleanMatch && cleanMatch[1]) {
      nextSrc = `${apiBase}/index.php?request=file/${cleanMatch[1]}&t=${Date.now()}`;
    } else if (queryMatch && queryMatch[1]) {
      nextSrc = `${apiBase}/file/${queryMatch[1]}?t=${Date.now()}`;
    }

    if (nextSrc) {
      (img as any).dataset = { ...(img as any).dataset, attempts: String(attempts + 1) };
      img.src = nextSrc;
    }
  }
}
