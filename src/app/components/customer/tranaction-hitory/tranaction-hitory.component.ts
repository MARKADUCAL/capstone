import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-tranaction-hitory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tranaction-hitory.component.html',
  styleUrl: './tranaction-hitory.component.css',
})
export class TranactionHitoryComponent {
  isViewModalOpen = false;
  isFeedbackModalOpen = false;
  currentRating = 0;
  ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  openViewModal(): void {
    console.log('Opening view modal');
    this.isViewModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
  }

  closeViewModal(): void {
    console.log('Closing view modal');
    this.isViewModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  openFeedbackModal(): void {
    console.log('Opening feedback modal');
    this.isFeedbackModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeFeedbackModal(): void {
    console.log('Closing feedback modal');
    this.isFeedbackModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  setRating(rating: number): void {
    console.log('Setting rating to:', rating);
    this.currentRating = rating;
  }

  getRatingText(): string {
    return this.currentRating > 0 ? this.ratingTexts[this.currentRating] : '';
  }
}
