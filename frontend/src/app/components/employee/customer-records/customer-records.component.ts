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
  raw?: any;
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

          return {
            id: Number(b.id ?? 0),
            customerName,
            service: serviceName,
            date: washDate ? new Date(washDate) : new Date(),
            time: washTime || '—',
            status,
            customerId: b.customerId || b.customer_id,
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
    this.selectedBooking = booking;
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
}
