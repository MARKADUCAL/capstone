import {
  Component,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../services/booking.service';
import {
  FeedbackService,
  CustomerFeedback,
} from '../../../services/feedback.service';
import {
  Booking,
  BookingStatus,
  VEHICLE_TYPES,
  VEHICLE_TYPE_CODES,
} from '../../../models/booking.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tranaction-hitory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tranaction-hitory.component.html',
  styleUrl: './tranaction-hitory.component.css',
})
export class TranactionHitoryComponent implements OnInit, OnDestroy {
  isViewModalOpen = false;
  isFeedbackModalOpen = false;
  isCancelModalOpen = false;
  currentRating = 0;
  employeeRating = 0;
  ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  currentFilter: string = 'all';
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedBooking: Booking | null = null;
  bookingToCancel: Booking | null = null;
  isCancelling = false;
  cancelReason: string = '';

  // Feedback related properties
  feedbackComment: string = '';
  employeeFeedbackComment: string = '';
  isSubmittingFeedback = false;
  feedbackSuccessMessage: string | null = null;
  feedbackErrorMessage: string | null = null;
  feedbackExistsMap: Map<number, boolean> = new Map(); // Track which bookings have feedback
  feedbackIdMap: Map<number, number> = new Map(); // Track feedback IDs for each booking
  isEditingFeedback = false; // Track if we're editing existing feedback

  readonly vehicleTypeLabels = VEHICLE_TYPES;
  readonly vehicleTypeCodes = VEHICLE_TYPE_CODES;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private bookingService: BookingService,
    private feedbackService: FeedbackService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadBookings();

    // Add event listener for when the page becomes visible (user navigates back)
    if (this.isBrowser) {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange.bind(this)
      );
    }
  }

  navigateToBooking(): void {
    if (!this.isBrowser) {
      return;
    }

    this.router.navigate(['/customer-view/appointment']).catch((error) => {
      console.error('Failed to navigate to appointment page:', error);
      this.errorMessage = 'Unable to open booking page. Please try again.';
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange.bind(this)
      );
    }
  }

  private handleVisibilityChange(): void {
    if (!document.hidden) {
      // Page became visible, refresh data to ensure consistency
      console.log('Page became visible, refreshing bookings...');
      this.loadBookings();
    }
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
    switch (s) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return s || 'pending';
    }
  }

  normalizeStatus(
    status: string
  ): 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected' | 'expired' | string {
    const s = (status ?? '').toString().trim().toLowerCase();
    if (s === 'confirmed' || s === 'approved') return 'approved';
    if (s === 'cancelled' || s === 'canceled') return 'cancelled';
    if (s === 'completed' || s === 'complete') return 'completed';
    if (s === 'pending') return 'pending';
    if (s === 'expired') return 'expired';
    return s;
  }

  getVehicleDisplayName(booking: Booking): string {
    const nickname =
      (booking as any).nickname ?? (booking as any).vehicleNickname;
    if (nickname && nickname.toString().trim().length > 0) {
      return nickname.toString().trim();
    }

    const model =
      (booking as any).vehicleModel ?? (booking as any).vehicle_model;
    if (model && model.toString().trim().length > 0) {
      return model.toString().trim();
    }

    const type = booking.vehicleType ?? (booking as any).vehicle_type;
    if (type && type.toString().trim().length > 0) {
      return type.toString().trim();
    }

    return 'Saved Vehicle';
  }

  getVehiclePlate(booking: Booking): string {
    const plate =
      booking.plateNumber ??
      (booking as any).plate_number ??
      (booking as any).vehiclePlate;

    if (plate && plate.toString().trim().length > 0) {
      return plate.toString().trim();
    }

    return 'Plate not set';
  }

  getVehicleTypeLabel(booking: Booking): string {
    const rawType =
      booking.vehicleType ??
      (booking as any).vehicle_type ??
      (booking as any).vehicleTypeCode;

    if (!rawType) {
      return 'Vehicle';
    }

    const normalized = rawType.toString().trim().toUpperCase();
    const directIndex = this.vehicleTypeCodes.indexOf(normalized);
    if (directIndex >= 0) {
      return this.vehicleTypeLabels[directIndex];
    }

    const codeMatch = rawType.toString().match(/^([A-Z]+)\s*-\s*/);
    if (codeMatch) {
      const matchIndex = this.vehicleTypeCodes.indexOf(
        codeMatch[1].toUpperCase()
      );
      if (matchIndex >= 0) {
        return this.vehicleTypeLabels[matchIndex];
      }
    }

    return rawType.toString();
  }

  private resolveServicePackageCode(booking: any): string | null {
    const rawValue =
      booking?.servicePackage ??
      booking?.service_package ??
      booking?.serviceCode ??
      booking?.service_code;

    if (!rawValue) {
      return null;
    }

    const normalized = rawValue
      .toString()
      .trim()
      .split(' ') // handle values like "p1 - Wash only"
      .shift()
      ?.split('-') // handle values like "p1- Wash"
      .shift();

    if (!normalized) {
      return null;
    }

    return normalized.toLowerCase();
  }

  getServiceName(booking: any): string {
    // Check if serviceName exists and is not just a package code
    if (booking.serviceName) {
      const serviceNameStr = booking.serviceName.toString().trim();
      // If serviceName is just a package code (like "Package p2"), ignore it and use mapping
      if (!serviceNameStr.match(/^Package\s+[pP]?\d+$/i)) {
        return serviceNameStr;
      }
    }

    const packageCode = this.resolveServicePackageCode(booking);

    if (!packageCode) {
      return `Package ${booking.servicePackage || 'Unknown'}`;
    }

    const packageMap: Record<string, string> = {
      '1': 'Body Wash',
      '2': 'Body Wash + Tire Black + Vacuum',
      '3': 'Body Wash + Body Wax + Tire Black',
      '4': 'Body Wash + Body Wax + Tire Black + Vacuum',
      p1: 'Wash Only',
      p2: 'Wash + Vacuum',
      p3: 'Wash + Vacuum + Hand Wax',
      p4: 'Wash + Vacuum + Buffing Wax',
    };

    return packageMap[packageCode] || `Package ${packageCode.toUpperCase()}`;
  }

  getServiceDescription(booking: any): string {
    if (booking.serviceDescription) {
      return booking.serviceDescription;
    }

    const packageCode = this.resolveServicePackageCode(booking);

    if (!packageCode) {
      return 'Car wash service';
    }

    const descriptionMap: Record<string, string> = {
      '1': 'Basic exterior wash with hand drying',
      '1.5': 'Exterior wash with tire black application',
      '2': 'Exterior wash, tire black, and interior vacuum',
      '3': 'Exterior wash with wax and tire black',
      '4': 'Complete wash with wax, tire black, and vacuum',
      p1: 'Quick exterior wash to refresh your vehicle.',
      p1_5: 'Exterior wash with tire black for extra shine.',
      p2: 'Comprehensive wash plus interior vacuum cleaning.',
      p3: 'Premium wash including vacuum and hand wax finish.',
      p4: 'Full-service wash with buffing wax for lasting protection.',
    };

    return descriptionMap[packageCode] || 'Car wash service';
  }

  getPackageLabel(booking: any): string {
    const packageCode = this.resolveServicePackageCode(booking);

    if (!packageCode) {
      const rawValue =
        booking?.servicePackage ??
        booking?.service_package ??
        booking?.serviceCode ??
        booking?.service_code;
      return rawValue ? `Package ${rawValue.toString().trim()}` : 'Package N/A';
    }

    return `Package ${packageCode.toLowerCase()}`;
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
                console.log('Bookings received from backend:', bookings);

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

                // Check for expired pending bookings and mark them
                this.markExpiredBookings();

                this.applyFilter();
                this.isLoading = false;
                console.log(
                  'Bookings loaded successfully:',
                  this.bookings.length
                );

                // Check for existing feedback for each completed booking
                this.checkExistingFeedback();

                // Log each booking status for debugging
                this.bookings.forEach((booking, index) => {
                  console.log(
                    `Booking ${index + 1}: ID=${booking.id}, Status=${
                      booking.status
                    }, Service=${this.getServiceName(booking)}`
                  );
                });
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

    // Ensure feedback data (customer rating/comment and admin reply) are up-to-date for this booking
    this.refreshFeedbackForBooking(booking);
  }

  closeViewModal(): void {
    console.log('Closing view modal');
    this.isViewModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  openFeedbackModal(booking?: Booking): void {
    console.log('Opening feedback modal');

    if (booking) {
      this.selectedBooking = booking;
      const canRateEmployee = this.hasEmployeeAssigned(booking);
      this.employeeRating = 0;
      this.employeeFeedbackComment = '';

      // Check if feedback exists for this booking
      if (this.hasFeedback(booking)) {
        // Load existing feedback for editing
        this.isEditingFeedback = true;
        this.loadExistingFeedback(booking);
      } else {
        // New feedback
        this.isEditingFeedback = false;
        this.currentRating = 0;
        this.feedbackComment = '';
      }

      if (!canRateEmployee) {
        this.employeeRating = 0;
        this.employeeFeedbackComment = '';
      }
    } else {
      this.isEditingFeedback = false;
      this.currentRating = 0;
      this.feedbackComment = '';
      this.employeeRating = 0;
      this.employeeFeedbackComment = '';
    }

    this.feedbackSuccessMessage = null;
    this.feedbackErrorMessage = null;
    this.isFeedbackModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  // Load existing feedback data for editing
  private loadExistingFeedback(booking: Booking): void {
    const bookingId = parseInt(booking.id);

    this.feedbackService.getAllFeedback(200).subscribe({
      next: (list) => {
        const feedbackForBooking = list.find((f) => f.booking_id === bookingId);

        if (feedbackForBooking) {
          this.currentRating =
            feedbackForBooking.service_rating ?? feedbackForBooking.rating ?? 0;
          this.feedbackComment =
            feedbackForBooking.service_comment ??
            feedbackForBooking.comment ??
            '';
          this.employeeRating = feedbackForBooking.employee_rating || 0;
          this.employeeFeedbackComment =
            feedbackForBooking.employee_comment || '';
          this.feedbackIdMap.set(bookingId, feedbackForBooking.id!);
          console.log(
            'Loaded existing feedback for editing:',
            feedbackForBooking
          );
        }
      },
      error: (error) => {
        console.error('Error loading existing feedback:', error);
        this.feedbackErrorMessage = 'Failed to load existing feedback.';
      },
    });
  }

  closeFeedbackModal(): void {
    console.log('Closing feedback modal');
    this.isFeedbackModalOpen = false;
    this.selectedBooking = null;
    this.currentRating = 0;
    this.feedbackComment = '';
    this.employeeRating = 0;
    this.employeeFeedbackComment = '';
    this.feedbackSuccessMessage = null;
    this.feedbackErrorMessage = null;
    this.isEditingFeedback = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  openCancelModal(booking: Booking): void {
    this.bookingToCancel = booking;
    this.cancelReason = '';
    this.isCancelModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.bookingToCancel = null;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  async cancelBooking(): Promise<void> {
    if (!this.bookingToCancel) return;

    this.isCancelling = true;
    try {
      console.log('🚀 Starting cancellation process...');
      console.log('📋 Booking to cancel:', this.bookingToCancel);
      console.log('🆔 Booking ID:', this.bookingToCancel.id);
      console.log('📝 Current Status:', this.bookingToCancel.status);

      const result = await this.bookingService
        .updateBookingStatus(
          this.bookingToCancel.id,
          'Cancelled',
          this.cancelReason && this.cancelReason.trim().length > 0
            ? this.cancelReason.trim()
            : undefined
        )
        .toPromise();

      console.log('📡 Backend response:', result);

      // Check if the update was successful
      if (result && result.success) {
        console.log('✅ Backend update successful');

        // Close modal first
        this.closeCancelModal();

        // Set success message
        this.successMessage =
          result.message || 'Booking cancelled successfully!';
        this.errorMessage = null;

        Swal.fire({
          icon: 'success',
          title: 'Booking cancelled',
          text: 'The booking has been cancelled successfully.',
          confirmButtonColor: '#3498db',
        });

        console.log('🎉 Booking cancelled successfully:', result.message);

        // Reload data from backend to ensure consistency
        console.log('🔄 Reloading data from backend...');
        await this.loadBookings();
        console.log('✅ Data reloaded from backend');
      } else {
        console.log('❌ Backend update failed:', result);
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('💥 Error cancelling booking:', error);
      this.errorMessage = 'Failed to cancel booking. Please try again.';
      this.successMessage = null;

      Swal.fire({
        icon: 'error',
        title: 'Cancellation failed',
        text: 'We could not cancel the booking. Please try again.',
        confirmButtonColor: '#e74c3c',
      });
    } finally {
      this.isCancelling = false;
    }
  }

  canCancelBooking(booking: Booking): boolean {
    return this.normalizeStatus(booking.status) === 'pending';
  }

  // Check if a booking date has passed (is in the past)
  private isBookingDatePassed(dateString: string): boolean {
    if (!dateString) return false;
    const trimmed = String(dateString).trim();
    if (
      trimmed === '0000-00-00' ||
      trimmed === '0000-00-00 00:00:00' ||
      trimmed.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    const bookingDate = new Date(trimmed);
    if (isNaN(bookingDate.getTime())) return false;

    // Set booking date to end of day for comparison
    bookingDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookingDate < today;
  }

  // Mark pending bookings as expired if their date has passed
  private markExpiredBookings(): void {
    const expiredBookingIds: string[] = [];

    this.bookings.forEach((booking) => {
      const normalizedStatus = this.normalizeStatus(booking.status);
      const washDate = booking.washDate || (booking as any).wash_date;
      if (normalizedStatus === 'pending' && this.isBookingDatePassed(washDate)) {
        // Mark locally as expired
        (booking as any).status = 'Expired';
        expiredBookingIds.push(booking.id);
      }
    });

    // Update expired bookings in the backend
    expiredBookingIds.forEach((bookingId) => {
      this.bookingService.updateBookingStatus(bookingId, 'Expired').subscribe({
        next: () => {
          console.log(`Booking #${bookingId} marked as Expired`);
        },
        error: (err) => {
          console.error(`Failed to mark booking #${bookingId} as Expired:`, err);
        },
      });
    });

    if (expiredBookingIds.length > 0) {
      console.log(
        `${expiredBookingIds.length} pending booking(s) marked as expired`
      );
    }
  }

  clearSuccessMessage(): void {
    this.successMessage = null;
  }

  setRating(rating: number): void {
    console.log('Setting rating to:', rating);
    this.currentRating = rating;
  }

  getRatingText(): string {
    return this.currentRating > 0 ? this.ratingTexts[this.currentRating] : '';
  }

  setEmployeeRating(rating: number): void {
    console.log('Setting employee rating to:', rating);
    this.employeeRating = rating;
  }

  getEmployeeRatingText(): string {
    return this.employeeRating > 0 ? this.ratingTexts[this.employeeRating] : '';
  }

  // Submit feedback for a completed booking (create or update)
  async submitFeedback(): Promise<void> {
    if (!this.selectedBooking || this.currentRating === 0) {
      this.feedbackErrorMessage =
        'Please select a rating before submitting feedback.';
      return;
    }

    const requiresEmployeeFeedback = this.selectedBooking
      ? this.hasEmployeeAssigned(this.selectedBooking)
      : false;

    if (requiresEmployeeFeedback && this.employeeRating === 0) {
      this.feedbackErrorMessage =
        'Please rate your assigned staff member before submitting.';
      return;
    }

    // Check if booking is completed
    if (this.normalizeStatus(this.selectedBooking.status) !== 'completed') {
      this.feedbackErrorMessage =
        'Feedback can only be submitted for completed bookings.';
      return;
    }

    this.isSubmittingFeedback = true;
    this.feedbackErrorMessage = null;
    this.feedbackSuccessMessage = null;

    try {
      // Get customer data from localStorage
      const customerData = localStorage.getItem('customer_data');
      if (!customerData) {
        throw new Error('Customer data not found. Please log in again.');
      }

      const customer = JSON.parse(customerData);
      const customerId = customer.id;

      if (!customerId) {
        throw new Error('Customer ID not found. Please log in again.');
      }

      const bookingId = parseInt(this.selectedBooking.id);
      const feedbackId = this.feedbackIdMap.get(bookingId);

      const serviceComment = this.feedbackComment.trim();
      const employeeComment = this.employeeFeedbackComment.trim();
      const employeeRatingValue =
        requiresEmployeeFeedback && this.employeeRating > 0
          ? this.employeeRating
          : null;

      if (this.isEditingFeedback && feedbackId) {
        // Update existing feedback
        const feedbackData: CustomerFeedback = {
          id: feedbackId,
          booking_id: bookingId,
          customer_id: customerId,
          rating: this.currentRating,
          comment: serviceComment || '',
          service_rating: this.currentRating,
          service_comment: serviceComment || '',
          employee_rating: employeeRatingValue,
          employee_comment: employeeComment || null,
          is_public: true,
        };

        console.log('🔄 Updating feedback:', feedbackData);

        const result = await this.feedbackService
          .updateCustomerFeedback(feedbackData)
          .toPromise();

        if (result && result.success) {
          console.log('✅ Feedback updated successfully');
          this.feedbackSuccessMessage =
            result.message || 'Feedback updated successfully!';

          // Close modal after a short delay
          setTimeout(() => {
            this.closeFeedbackModal();
            // Reload bookings to refresh the data
            this.loadBookings();
          }, 2000);
        } else {
          throw new Error('Failed to update feedback');
        }
      } else {
        // Create new feedback
        const feedbackData: CustomerFeedback = {
          booking_id: bookingId,
          customer_id: customerId,
          rating: this.currentRating,
          comment: serviceComment || '',
          service_rating: this.currentRating,
          service_comment: serviceComment || '',
          employee_rating: employeeRatingValue,
          employee_comment: employeeComment || null,
          is_public: true,
        };

        console.log('🚀 Submitting new feedback:', feedbackData);

        const result = await this.feedbackService
          .submitFeedback(feedbackData)
          .toPromise();

        if (result && result.success) {
          console.log('✅ Feedback submitted successfully');
          this.feedbackSuccessMessage =
            result.message || 'Feedback submitted successfully!';

          // Mark this booking as having feedback
          this.feedbackExistsMap.set(bookingId, true);

          // Store feedback ID if available
          if (result.data && result.data.id) {
            this.feedbackIdMap.set(bookingId, result.data.id);
          }

          // Close modal after a short delay
          setTimeout(() => {
            this.closeFeedbackModal();
            // Reload bookings to refresh the data
            this.loadBookings();
          }, 2000);
        } else {
          throw new Error('Failed to submit feedback');
        }
      }
    } catch (error) {
      console.error('💥 Error submitting/updating feedback:', error);
      this.feedbackErrorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to submit feedback. Please try again.';
    } finally {
      this.isSubmittingFeedback = false;
    }
  }

  // Check if a booking can receive feedback (only completed bookings)
  canSubmitFeedback(booking: Booking): boolean {
    return this.normalizeStatus(booking.status) === 'completed';
  }

  // Check if a booking already has feedback
  hasFeedback(booking: Booking): boolean {
    const bookingId = parseInt(booking.id);
    return this.feedbackExistsMap.get(bookingId) || false;
  }

  // Check for existing feedback for all completed bookings
  private checkExistingFeedback(): void {
    const completedBookings = this.bookings.filter(
      (booking) => this.normalizeStatus(booking.status) === 'completed'
    );

    completedBookings.forEach((booking) => {
      const bookingId = parseInt(booking.id);
      this.feedbackService.getAllFeedback(200).subscribe({
        next: (list) => {
          const feedbackForBooking = list.find(
            (f) => f.booking_id === bookingId
          );
          const exists = !!feedbackForBooking;
          this.feedbackExistsMap.set(bookingId, exists);
          console.log(`Feedback exists for booking ${bookingId}: ${exists}`);
          // Attach customer rating/comment and admin comment (if present) to the booking for modal display
          if (feedbackForBooking) {
            const serviceRating =
              feedbackForBooking.service_rating ??
              feedbackForBooking.rating ??
              null;
            const serviceComment =
              feedbackForBooking.service_comment ??
              feedbackForBooking.comment ??
              null;

            (booking as any).serviceRating = serviceRating;
            (booking as any).customerRating = serviceRating;
            (booking as any).rating = serviceRating;
            (booking as any).serviceComment = serviceComment;
            (booking as any).customerRatingComment = serviceComment;
            (booking as any).ratingComment = serviceComment;
            (booking as any).employeeRating =
              feedbackForBooking.employee_rating ?? null;
            (booking as any).employeeComment =
              feedbackForBooking.employee_comment ?? null;
            (booking as any).feedbackCreatedAt = feedbackForBooking.created_at;
            (booking as any).feedbackCustomerName =
              feedbackForBooking.customer_name;
            (booking as any).feedbackServiceName =
              feedbackForBooking.service_name;
            (booking as any).feedbackVisibility = feedbackForBooking.is_public
              ? 'Public'
              : 'Private';
            // Store feedback ID for editing
            if (feedbackForBooking.id) {
              this.feedbackIdMap.set(bookingId, feedbackForBooking.id);
            }
          }
          // Attach admin comment to booking for display if present
          if (
            feedbackForBooking &&
            (feedbackForBooking.admin_comment || '').toString().trim().length >
              0
          ) {
            (booking as any).adminComment = feedbackForBooking.admin_comment;
            (booking as any).adminCommentedAt =
              feedbackForBooking.admin_commented_at;
          }
        },
        error: (error) => {
          console.error(
            `Error checking feedback for booking ${bookingId}:`,
            error
          );
          this.feedbackExistsMap.set(bookingId, false);
        },
      });
    });
  }

  // Refresh feedback data for a single booking (used when opening the details modal)
  private refreshFeedbackForBooking(booking: Booking): void {
    const bookingId = parseInt(booking.id);
    this.feedbackService.getAllFeedback(200).subscribe({
      next: (list) => {
        const feedbackForBooking = list.find((f) => f.booking_id === bookingId);
        const exists = !!feedbackForBooking;
        this.feedbackExistsMap.set(bookingId, exists);
        if (feedbackForBooking) {
          const serviceRating =
            feedbackForBooking.service_rating ??
            feedbackForBooking.rating ??
            null;
          const serviceComment =
            feedbackForBooking.service_comment ??
            feedbackForBooking.comment ??
            null;

          (booking as any).serviceRating = serviceRating;
          (booking as any).customerRating = serviceRating;
          (booking as any).rating = serviceRating;
          (booking as any).serviceComment = serviceComment;
          (booking as any).customerRatingComment = serviceComment;
          (booking as any).ratingComment = serviceComment;
          (booking as any).employeeRating =
            feedbackForBooking.employee_rating ?? null;
          (booking as any).employeeComment =
            feedbackForBooking.employee_comment ?? null;
          (booking as any).feedbackCreatedAt = feedbackForBooking.created_at;
          (booking as any).feedbackCustomerName =
            feedbackForBooking.customer_name;
          (booking as any).feedbackServiceName =
            feedbackForBooking.service_name;
          (booking as any).feedbackVisibility = feedbackForBooking.is_public
            ? 'Public'
            : 'Private';
          // Store feedback ID for editing
          if (feedbackForBooking.id) {
            this.feedbackIdMap.set(bookingId, feedbackForBooking.id);
          }
          if (
            (feedbackForBooking.admin_comment || '').toString().trim().length >
            0
          ) {
            (booking as any).adminComment = feedbackForBooking.admin_comment;
            (booking as any).adminCommentedAt =
              feedbackForBooking.admin_commented_at;
          }
        }
      },
      error: (error) => {
        console.error(
          `Error refreshing feedback for booking ${bookingId}:`,
          error
        );
      },
    });
  }

  // Clear feedback messages
  clearFeedbackMessages(): void {
    this.feedbackSuccessMessage = null;
    this.feedbackErrorMessage = null;
  }

  // New methods for enhanced UI
  getFilterCount(filter: string): number {
    if (filter === 'all') {
      return this.bookings.length;
    }
    return this.bookings.filter((booking) => {
      const normalized = this.normalizeStatus(booking.status);
      return normalized === filter;
    }).length;
  }

  trackByBooking(index: number, booking: Booking): string | number {
    return booking.id;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '🎉';
      case 'approved':
        return '✅';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      case 'rejected':
        return '❌';
      case 'expired':
        return '⌛';
      default:
        return '📋';
    }
  }

  getStatusDescription(status: string): string {
    switch (status) {
      case 'completed':
        return 'Your car wash service has been completed successfully!';
      case 'approved':
        return 'Your booking has been approved and is being processed.';
      case 'pending':
        return 'Your booking is currently under review.';
      case 'cancelled':
        return 'This booking has been cancelled.';
      case 'rejected':
        return 'This booking has been declined.';
      case 'expired':
        return 'This booking has expired as the scheduled date has passed.';
      default:
        return 'Your booking status is being updated.';
    }
  }

  // Helper method to get rejection reason with fallback to notes field
  getRejectionReason(booking: Booking): string | null {
    // First check dedicated rejection reason fields
    if (booking.rejectionReason) {
      return booking.rejectionReason;
    }
    if (booking.rejection_reason) {
      return booking.rejection_reason;
    }

    // Fallback: check notes field for rejection reason
    if (booking.status === 'rejected' && booking.notes) {
      const notes = booking.notes;
      // Check for "Rejection reason:" prefix
      if (notes.includes('Rejection reason:')) {
        return notes.split('Rejection reason:')[1]?.trim() || null;
      }
      // Check for "Customer reason:" prefix (legacy format)
      if (notes.includes('Customer reason:')) {
        return notes.split('Customer reason:')[1]?.trim() || null;
      }
      // If no prefix found but status is rejected, return the entire notes
      return notes.trim();
    }

    return null;
  }

  formatTime(time: string): string {
    if (!time) return '';

    try {
      // Handle different time formats
      let timeStr = time.toString().trim();

      // If it's already in 12-hour format, return as is
      if (
        timeStr.toLowerCase().includes('am') ||
        timeStr.toLowerCase().includes('pm')
      ) {
        return timeStr;
      }

      // If it's in 24-hour format (HH:MM:SS or HH:MM), convert to 12-hour
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        if (isNaN(hour) || isNaN(minute)) {
          return timeStr; // Return original if parsing fails
        }

        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');

        return `${displayHour}:${displayMinute}${period}`;
      }

      return timeStr; // Return original if no recognizable format
    } catch (error) {
      console.error('Error formatting time:', error);
      return time; // Return original if any error occurs
    }
  }

  // Custom date formatting method to avoid timezone issues
  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      // Parse the date string directly without timezone conversion
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const month = months[date.getMonth()];
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original on error
    }
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getEmployeeInfo(booking: any): string {
    if (
      booking.assigned_employee_id &&
      booking.employee_first_name &&
      booking.employee_last_name
    ) {
      const employeeName = `${booking.employee_first_name} ${booking.employee_last_name}`;
      if (booking.employee_position) {
        return `${employeeName} (${booking.employee_position})`;
      }
      return employeeName;
    }
    return 'Pending Assignment';
  }

  hasEmployeeAssigned(booking: any): boolean {
    return !!(
      booking.assigned_employee_id &&
      booking.employee_first_name &&
      booking.employee_last_name
    );
  }

  // New methods for enhanced modal display
  getCustomerRating(booking: any): number | null {
    const rating =
      booking.serviceRating ?? booking.customerRating ?? booking.rating ?? null;
    return typeof rating === 'number' ? rating : null;
  }

  getCustomerRatingComment(booking: any): string | null {
    return (
      booking.serviceComment ||
      booking.customerRatingComment ||
      booking.ratingComment ||
      null
    );
  }

  getEmployeeRating(booking: any): number | null {
    const rating = booking.employeeRating ?? null;
    return typeof rating === 'number' ? rating : null;
  }

  getEmployeeRatingComment(booking: any): string | null {
    return booking.employeeComment || null;
  }

  isSubmitFeedbackDisabled(): boolean {
    const requiresEmployeeFeedback =
      this.selectedBooking && this.hasEmployeeAssigned(this.selectedBooking);
    const missingEmployeeRating =
      requiresEmployeeFeedback && this.employeeRating === 0;
    return (
      this.currentRating === 0 ||
      missingEmployeeRating ||
      this.isSubmittingFeedback
    );
  }

  getBookingNotes(booking: Booking): string | null {
    const notes = (booking?.notes || '').toString();
    if (!notes.trim()) {
      return null;
    }

    if (this.normalizeStatus(booking.status) === 'rejected') {
      const rejectionPrefix = 'Rejection reason:';
      const legacyPrefix = 'Customer reason:';

      if (notes.includes(rejectionPrefix)) {
        const originalNotes = notes.split(rejectionPrefix)[0]?.trim();
        if (originalNotes) {
          return originalNotes;
        }
      }

      if (notes.includes(legacyPrefix)) {
        const originalNotes = notes.split(legacyPrefix)[0]?.trim();
        if (originalNotes) {
          return originalNotes;
        }
      }
    }

    return notes.trim();
  }

  getCustomerRatingLabel(booking: Booking): string {
    const rating = this.getCustomerRating(booking);
    if (!rating || rating < 0 || rating >= this.ratingTexts.length) {
      return '';
    }
    return this.ratingTexts[Math.round(rating)] || '';
  }

  getFeedbackVisibility(booking: Booking): string {
    const visibility = (booking as any).feedbackVisibility;
    if (!visibility) {
      return '';
    }
    return visibility;
  }

  getStarDisplay(rating: number): string {
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) {
      stars += '☆';
    }
    return stars;
  }

  hasAdditionalInfo(booking: any): boolean {
    return !!(
      this.getBookingNotes(booking) ||
      booking.specialRequests ||
      booking.bookingSource ||
      booking.estimatedDuration
    );
  }

  hasServiceTimeline(booking: any): boolean {
    return !!(
      booking.bookingCreatedAt ||
      booking.approvedAt ||
      booking.startedAt ||
      booking.completedAt
    );
  }
}
