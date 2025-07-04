import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';

@Component({
  selector: 'app-tranaction-hitory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tranaction-hitory.component.html',
  styleUrl: './tranaction-hitory.component.css',
})
export class TranactionHitoryComponent implements OnInit {
  isViewModalOpen = false;
  isFeedbackModalOpen = false;
  currentRating = 0;
  ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  currentFilter: string = 'all';
  isLoading = true;
  errorMessage: string | null = null;
  selectedBooking: Booking | null = null;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private bookingService: BookingService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.currentFilter === 'all') {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(
        (booking) => booking.status.toLowerCase() === this.currentFilter
      );
    }
  }

  loadBookings(): void {
    if (this.isBrowser) {
      const customerData = localStorage.getItem('customer_data');
      if (customerData) {
        const customer = JSON.parse(customerData);
        const customerId = customer.id;
        if (customerId) {
          this.isLoading = true;
          this.bookingService.getBookingsByCustomerId(customerId).subscribe({
            next: (bookings) => {
              this.bookings = bookings;
              this.applyFilter();
              this.isLoading = false;
            },
            error: (error) => {
              this.errorMessage = error.message;
              this.isLoading = false;
            },
          });
        }
      } else {
        this.errorMessage =
          'You must be logged in to view your transaction history.';
        this.isLoading = false;
      }
    }
  }

  openViewModal(booking: Booking): void {
    this.selectedBooking = booking;
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
