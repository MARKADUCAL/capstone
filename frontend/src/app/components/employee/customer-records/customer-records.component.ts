import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';

interface CustomerBooking {
  id: number;
  customerName: string;
  service: string;
  date: Date;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
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

  constructor(private bookingService: BookingService) {}

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
          const nickname = b.nickname || '';
          const customerName =
            nickname || `${firstName} ${lastName}`.trim() || 'Unknown';

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
            raw: b,
          } as CustomerBooking;
        });

        // Only keep completed bookings
        this.customerBookings = mapped.filter((m) => m.status === 'Completed');
      },
      error: (err) => {
        console.error('Failed to load bookings', err);
        this.customerBookings = [];
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
}
