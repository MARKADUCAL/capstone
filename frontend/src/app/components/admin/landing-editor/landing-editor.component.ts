import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Swal from 'sweetalert2';
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
  readonly MAX_GALLERY_IMAGES = 10;
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
  editingGalleryIndex: number | null = null;
  hoveredGalleryIndex: number | null = null;

  toggleEditGallery(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.editingGalleryIndex === index) {
      this.editingGalleryIndex = null;
    } else {
      this.editingGalleryIndex = index;
    }
  }

  cancelEditGallery(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const img = this.content.galleryImages[index];
    if (!img.url && !img.preview && !img.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Image',
        text: 'Please upload an image or provide a URL first, or delete this item.',
        confirmButtonColor: '#9C2780'
      });
      return;
    }
    this.editingGalleryIndex = null;
  }

  getImageTitle(url: string | undefined): string {
    if (!url) return 'New Image';
    // Remove query params if any
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    const filename = parts[parts.length - 1];
    return filename ? decodeURIComponent(filename) : 'Image';
  }

  // Save properties
  lastSavedTime: Date | null = null;

  formatLastSaved(): string {
    if (!this.lastSavedTime) return 'Unsaved changes';
    
    const d = new Date(this.lastSavedTime);
    const now = new Date();
    
    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getFullYear() === yesterday.getFullYear();

    let timeString = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) {
      return `✔ Today at ${timeString}`;
    } else if (isYesterday) {
      return `✔ Yesterday at ${timeString}`;
    } else {
      const dateString = d.toLocaleDateString();
      return `✔ ${dateString} at ${timeString}`;
    }
  }

  showRequirementsAlert(): void {
    Swal.fire({
      width: '450px',
      padding: '0',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Got it!',
      customClass: {
        container: 'req-modal-container',
        popup: 'req-modal-popup',
        title: 'req-modal-title',
        closeButton: 'req-modal-close',
        htmlContainer: 'req-modal-html',
        actions: 'req-modal-actions',
        confirmButton: 'req-modal-confirm'
      },
      html: `
        <div class="req-header-content">
          <div class="req-header-icon"><mat-icon class="mat-icon material-icons">assignment</mat-icon></div>
          <div class="req-header-text">
            <div class="req-maintitle" style="font-size: 18px;">Image Upload Requirements</div>
            <div class="req-subtitle" style="font-size: 13px; font-weight: normal; color: #8c889f; margin-top: 4px; text-transform: none; letter-spacing: 0;">Make sure your image meets these before uploading</div>
          </div>
        </div>
        <div class="req-body">
          <div class="req-list">
            
            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">image</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">ACCEPTED FORMATS</div>
                <div class="req-item-val" style="font-size: 16px;">JPG, PNG, WEBP, GIF</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>
            
            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #A1887F;">inventory_2</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">MAXIMUM FILE SIZE</div>
                <div class="req-item-val" style="font-size: 16px;">5 MB per image</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>

            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #90A4AE;">square_foot</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">RECOMMENDED SIZE</div>
                <div class="req-item-val" style="font-size: 16px;">1280 × 720px or higher</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>

            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #B0BEC5;">straighten</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">MINIMUM DIMENSIONS</div>
                <div class="req-item-val" style="font-size: 16px;">300 × 200px</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>
            
            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #64B5F6;">looks_one</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">MAX IMAGES</div>
                <div class="req-item-val" style="font-size: 16px;">Up to ${this.MAX_GALLERY_IMAGES} gallery images</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>
            
            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #F06292;">palette</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">COLOR MODE</div>
                <div class="req-item-val" style="font-size: 16px;">RGB only (no CMYK)</div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>

            <div class="req-item">
              <div class="req-item-icon"><mat-icon class="mat-icon material-icons" style="color: #E57373;">block</mat-icon></div>
              <div class="req-item-text">
                <div class="req-item-label">AVOID</div>
                <div class="req-item-val" style="font-size: 16px;"><strong>Blur any vehicle plate numbers!</strong></div>
              </div>
              <div class="req-item-check"><mat-icon class="mat-icon material-icons" style="color: #4CAF50;">check</mat-icon></div>
            </div>

          </div>

          <div class="req-warning">
            <mat-icon class="mat-icon material-icons req-warning-icon" style="color: #FBC02D; margin-right: 12px;">lightbulb</mat-icon>
            <span style="color: #5D4037; font-size: 14px; line-height: 1.4;">Images that don't meet these requirements will be rejected on upload.</span>
          </div>
        </div>
      `
    });
  }

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
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Navigation properties
  activeSection: string = 'hero';
  navSections: string[] = ['hero', 'gallery', 'contact', 'footer'];

  scrollToSection(sectionId: string): void {
    this.activeSection = sectionId;
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTimeStr = localStorage.getItem('landingEditorLastSaved');
      if (savedTimeStr) {
        this.lastSavedTime = new Date(savedTimeStr);
      }
    }
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
          // Normalize any legacy query-style or API file URLs to direct /uploads paths
          const normalize = (url: string | undefined | null): string => {
            if (!url) return '';
            const val = String(url);
            const q = val.match(/index\.php\?request=file\/([^&#]+)/);
            if (q && q[1]) {
              const base = val
                .split('/index.php?request=file/')[0]
                .replace(/\/$/, '');
              return `${base.replace(/\/api$/, '')}/uploads/${q[1]}`;
            }
            const api = val.match(/\/api\/file\/([^\/?#]+)/);
            if (api && api[1]) {
              return val
                .replace(/\/api\/file\/[^\/?#]+$/, `/uploads/${api[1]}`)
                .replace(/\/api\//, '/');
            }
            return val;
          };
          this.content.heroBackgroundUrl = normalize(
            this.content.heroBackgroundUrl
          );
          this.content.galleryImages = (this.content.galleryImages || [])
            .slice(0, this.MAX_GALLERY_IMAGES)
            .map((g) => ({
              ...g,
              url: normalize(g.url),
            }));
          // Ensure isUploadingGallery array matches galleryImages length
          while (this.isUploadingGallery.length < this.content.galleryImages.length) {
            this.isUploadingGallery.push(false);
          }
          while (this.isUploadingGallery.length > this.content.galleryImages.length) {
            this.isUploadingGallery.pop();
          }
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
    if (this.content.galleryImages.length >= this.MAX_GALLERY_IMAGES) {
      this.snackBar.open(
        `Gallery is limited to ${this.MAX_GALLERY_IMAGES} images. Please remove an image before adding a new one.`,
        'Close',
        { duration: 4000 }
      );
      return;
    }
    this.content.galleryImages.push({ url: '', alt: '' });
    this.isUploadingGallery.push(false);
    this.editingGalleryIndex = this.content.galleryImages.length - 1;
    this.updateValidation();
  }

  removeGalleryImage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    Swal.fire({
      title: 'Delete Image?',
      text: "Are you sure you want to delete this image? You cannot undo this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#8c889f',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.content.galleryImages.splice(index, 1);
        this.isUploadingGallery.splice(index, 1);
        
        if (this.editingGalleryIndex === index) {
          this.editingGalleryIndex = null;
        } else if (this.editingGalleryIndex !== null && this.editingGalleryIndex > index) {
          this.editingGalleryIndex--;
        }
        this.updateValidation();
        Swal.fire({
          title: 'Deleted!',
          text: 'The image has been removed.',
          icon: 'success',
          confirmButtonColor: '#9C2780',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
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
          this.lastSavedTime = new Date();
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('landingEditorLastSaved', this.lastSavedTime.toISOString());
          }
          this.clearLandingPageCache();
          this.reloadContent();
          Swal.fire({
            title: 'Saved!',
            text: 'All changes saved successfully to the database.',
            icon: 'success',
            confirmButtonColor: '#9C2780',
            timer: 2000,
            showConfirmButton: false
          });
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
        const galleryPayload = (this.content.galleryImages || [])
          .slice(0, this.MAX_GALLERY_IMAGES)
          .map((g) => ({
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
            next: ({ total, ok }: any) => {
              this.isSaving = false;
              if (ok === total) {
                this.lastSavedTime = new Date();
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('landingEditorLastSaved', this.lastSavedTime.toISOString());
                }
                this.clearLandingPageCache();
                this.reloadContent();
                Swal.fire({
                  title: 'Saved!',
                  text: 'All changes saved successfully to the database.',
                  icon: 'success',
                  confirmButtonColor: '#9C2780',
                  timer: 2000,
                  showConfirmButton: false
                });
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
      
      // Auto-upload
      this.uploadGalleryImage(index);
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
    const attempts = Number(img.getAttribute('data-attempts') || 0);
    if (attempts > 2) return;

    const apiBase = environment.apiUrl.replace(/\/$/, '');
    let nextSrc = '';

    const cleanMatch = currentSrc.match(/\/api\/file\/([^/?#]+)$/);
    const queryMatch = currentSrc.match(
      /\/api\/index\.php\?request=file\/([^&#]+)/
    );

    if (cleanMatch && cleanMatch[1]) {
      nextSrc = `${apiBase}/index.php?request=file/${
        cleanMatch[1]
      }&t=${Date.now()}`;
    } else if (queryMatch && queryMatch[1]) {
      nextSrc = `${apiBase}/file/${queryMatch[1]}?t=${Date.now()}`;
    }

    if (nextSrc) {
      img.setAttribute('data-attempts', String(attempts + 1));
      img.src = nextSrc;
    }
  }
}
