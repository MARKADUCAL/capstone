import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../services/booking.service';
import { FeedbackService } from '../../../services/feedback.service';
import { Booking } from '../../../models/booking.model';

interface CustomerBooking {
  id: number;
  customerName: string;
  service: string;
  date: Date;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  customerId?: number;
  averageRating?: number;
  totalRatings?: number;
  vehicleType?: string;
  plateNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  serviceDescription?: string;
  paymentType?: string;
  assignedEmployeeName?: string;
  raw?: any;
  // Customer feedback fields for individual booking
  customerRating?: number;
  customerRatingComment?: string;
  feedbackCreatedAt?: string;
  feedbackId?: number;
}

@Component({
  selector: 'app-customer-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-records.component.html',
  styleUrl: './customer-records.component.css',
})
export class CustomerRecordsComponent implements OnInit {
  customerBookings: CustomerBooking[] = [];
  searchTerm: string = '';
  selectedBooking: CustomerBooking | null = null;

  constructor(
    private bookingService: BookingService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit() {
    this.loadCompletedBookings();
  }

  private loadCompletedBookings() {
    this.bookingService.getAllBookings().subscribe({
      next: (bookings: any[]) => {
        const mapped: CustomerBooking[] = (bookings || []).map((b: any) => {
          const statusRaw = (b.status || '').toString().toLowerCase();
          let status: CustomerBooking['status'] = 'Pending';
          if (statusRaw === 'completed') status = 'Completed';
          else if (statusRaw === 'cancelled') status = 'Cancelled';
          else if (statusRaw === 'confirmed' || statusRaw === 'approved')
            status = 'Confirmed';
          else if (statusRaw === 'pending') status = 'Pending';

          const firstName = b.firstName || b.first_name || '';
          const lastName = b.lastName || b.last_name || '';
          const customerName =
            `${firstName} ${lastName}`.trim() || 'Unknown Customer';

          const serviceName =
            b.services || b.serviceName || b.service_name || 'N/A';
          const washDate: string = b.washDate || b.wash_date || b.date || '';
          const washTime: string = b.washTime || b.wash_time || b.time || '';

          const vehicleType =
            b.vehicleType ||
            b.vehicle_type ||
            b.vehicleCategory ||
            b.vehicle_category ||
            undefined;

          const plateNumber = b.plateNumber ?? b.plate_number;
          const vehicleModel = b.vehicleModel ?? b.vehicle_model;
          const vehicleColor = b.vehicleColor ?? b.vehicle_color;

          const serviceDescription =
            b.serviceDescription ||
            b.service_description ||
            b.serviceDetails ||
            b.service_details ||
            undefined;

          const paymentType =
            b.paymentType ||
            b.payment_type ||
            b.paymentMethod ||
            b.payment_method ||
            undefined;

          const assignedEmployeeName =
            b.assignedEmployeeName ||
            b.assigned_employee_name ||
            this.buildEmployeeName(
              b.employeeFirstName || b.employee_first_name,
              b.employeeLastName || b.employee_last_name
            );

          return {
            id: Number(b.id ?? 0),
            customerName,
            service: serviceName,
            date: washDate ? new Date(washDate) : new Date(),
            time: washTime || '—',
            status,
            customerId: b.customerId || b.customer_id,
            vehicleType,
            plateNumber,
            vehicleModel,
            vehicleColor,
            serviceDescription,
            paymentType,
            assignedEmployeeName,
            raw: b,
          } as CustomerBooking;
        });

        // Only keep completed bookings
        this.customerBookings = mapped.filter((m) => m.status === 'Completed');

        // Load ratings for each customer
        this.loadCustomerRatings();
      },
      error: (err) => {
        console.error('Failed to load bookings', err);
        this.customerBookings = [];
      },
    });
  }

  private loadCustomerRatings() {
    this.feedbackService.getAllFeedback().subscribe({
      next: (feedbackList) => {
        // Group feedback by customer ID and calculate average ratings
        const customerRatings = new Map<
          number,
          { total: number; count: number }
        >();

        feedbackList.forEach((feedback) => {
          if (feedback.customer_id && feedback.rating) {
            const existing = customerRatings.get(feedback.customer_id);
            if (existing) {
              existing.total += feedback.rating;
              existing.count += 1;
            } else {
              customerRatings.set(feedback.customer_id, {
                total: feedback.rating,
                count: 1,
              });
            }
          }
        });

        // Update customer bookings with their average ratings
        this.customerBookings = this.customerBookings.map((booking) => {
          if (booking.customerId) {
            const ratingData = customerRatings.get(booking.customerId);
            if (ratingData) {
              return {
                ...booking,
                averageRating:
                  Math.round((ratingData.total / ratingData.count) * 10) / 10, // Round to 1 decimal
                totalRatings: ratingData.count,
              };
            }
          }
          return booking;
        });
      },
      error: (err) => {
        console.error('Failed to load customer ratings', err);
      },
    });
  }

  openDetails(booking: CustomerBooking) {
    // Always load individual feedback for this booking
    const bookingWithFeedback = { ...booking };

    this.feedbackService.getFeedbackByBookingId(booking.id).subscribe({
      next: (feedbackList) => {
        if (feedbackList && feedbackList.length > 0) {
          const feedback = feedbackList[0];
          bookingWithFeedback.customerRating = feedback.rating;
          bookingWithFeedback.customerRatingComment = feedback.comment;
          bookingWithFeedback.feedbackCreatedAt = feedback.created_at;
          bookingWithFeedback.feedbackId = feedback.id;
        }
        this.selectedBooking = bookingWithFeedback;
      },
      error: (err) => {
        console.error('Error loading feedback:', err);
        this.selectedBooking = bookingWithFeedback;
      },
    });
  }

  closeDetails() {
    this.selectedBooking = null;
  }

  get filteredBookings(): CustomerBooking[] {
    return this.customerBookings.filter((booking) => {
      const matchesSearch =
        booking.customerName
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        booking.service.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  getStarRating(rating: number | undefined): string {
    if (!rating) return '0';
    return rating.toFixed(1);
  }

  getStarColor(rating: number | undefined): string {
    if (!rating) return '#ccc';
    if (rating >= 4.5) return '#ffd700'; // Gold for high ratings
    if (rating >= 4.0) return '#ff6b35'; // Orange for good ratings
    if (rating >= 3.0) return '#ffa500'; // Orange for average ratings
    return '#ff4444'; // Red for low ratings
  }

  formatTime(time: string | undefined | null): string {
    if (!time) return '—';

    const trimmed = time.trim();
    if (!trimmed || trimmed === '—') return '—';

    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);

    if (!match) {
      return trimmed;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = match[3] ? Number(match[3]) : 0;
    const period = match[4]?.toUpperCase();

    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const reference = new Date();
    reference.setHours(hours, minutes, seconds, 0);

    return reference.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private buildEmployeeName(
    firstName?: string,
    lastName?: string
  ): string | undefined {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    const combined = [first, last].filter((part) => part.length > 0).join(' ');
    return combined.length > 0 ? combined : undefined;
  }

  getStarDisplay(rating: number | undefined): string {
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) {
      stars += '☆';
    }
    return stars;
  }

  formatFeedbackDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return '';
    }
  }
}
