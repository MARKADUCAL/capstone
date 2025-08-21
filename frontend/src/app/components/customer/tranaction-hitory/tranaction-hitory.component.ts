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
      this.filteredBookings = this.bookings.filter((booking) => {
        const normalized = this.normalizeStatus(booking.status);
        return normalized === this.currentFilter;
      });
    }
  }

  displayStatus(status: string): string {
    const raw = (status ?? '').toString().trim();
    if (!raw) return 'pending';
    const s = this.normalizeStatus(raw);
    return s || 'pending';
  }

  normalizeStatus(
    status: string
  ): 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected' | string {
    const s = (status ?? '').toString().trim().toLowerCase();
    if (s === 'confirmed' || s === 'approved') return 'approved';
    if (s === 'cancelled' || s === 'canceled' || s === 'rejected')
      return 'cancelled';
    if (s === 'completed' || s === 'complete') return 'completed';
    if (s === 'pending') return 'pending';
    return s;
  }

  loadBookings(): void {
    if (this.isBrowser) {
      console.log('Loading bookings...');

      // Check if customer is logged in
      const customerData = localStorage.getItem('customer_data');
      console.log('Customer data from localStorage:', customerData);

      if (customerData) {
        try {
          const customer = JSON.parse(customerData);
          const customerId = customer.id;
          console.log('Customer ID:', customerId);

          if (customerId) {
            this.isLoading = true;
            this.errorMessage = null;

            this.bookingService.getBookingsByCustomerId(customerId).subscribe({
              next: (bookings) => {
                console.log('Bookings received:', bookings);

                // Sort bookings by washDate and washTime descending (newest first)
                this.bookings = bookings.sort((a: any, b: any) => {
                  const dateA = new Date(
                    a.washDate + 'T' + (a.washTime || '00:00:00')
                  );
                  const dateB = new Date(
                    b.washDate + 'T' + (b.washTime || '00:00:00')
                  );
                  return dateB.getTime() - dateA.getTime();
                });

                this.applyFilter();
                this.isLoading = false;
                console.log(
                  'Bookings loaded successfully:',
                  this.bookings.length
                );
              },
              error: (error) => {
                console.error('Error loading bookings:', error);
                this.errorMessage = `Failed to load bookings: ${error.message}`;
                this.isLoading = false;
              },
            });
          } else {
            console.error('Customer ID not found in customer data');
            this.errorMessage = 'Customer ID not found. Please log in again.';
            this.isLoading = false;
          }
        } catch (error) {
          console.error('Error parsing customer data:', error);
          this.errorMessage = 'Invalid customer data. Please log in again.';
          this.isLoading = false;
        }
      } else {
        console.log('No customer data found in localStorage');
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
