import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  VEHICLE_TYPES,
  PAYMENT_TYPES,
  BookingForm,
  WASHING_POINTS,
  CAR_WASH_SERVICES,
  Booking,
  BookingStatus,
} from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatStepperModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css'],
})
export class AppointmentComponent implements OnInit {
  // Properties for booking modal
  showBookingModal = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  availableSlots = 12;

  // Form options
  vehicleTypes = VEHICLE_TYPES;
  services = CAR_WASH_SERVICES.map((service) => service.name);
  washingPoints = WASHING_POINTS.filter((point) => point.available).map(
    (point) => point.name
  );
  paymentTypes = PAYMENT_TYPES;

  // Booking form model
  bookingForm: BookingForm = {
    vehicleType: '',
    services: '',
    washingPoint: '',
    nickname: '',
    phone: '',
    washDate: '',
    washTime: '',
    paymentType: '',
    notes: '',
  };

  // Customer bookings
  customerBookings: Booking[] = [];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  // Load customer bookings
  loadBookings(): void {
    this.bookingService.getBookings().subscribe(
      (bookings) => {
        this.customerBookings = bookings;
      },
      (error) => {
        this.errorMessage = 'Failed to load bookings: ' + error.message;
      }
    );
  }

  // Open booking modal
  openBookingModal(): void {
    this.resetForm();
    this.showBookingModal = true;
  }

  // Close booking modal
  closeBookingModal(): void {
    this.showBookingModal = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Reset form to initial state
  resetForm(): void {
    this.bookingForm = {
      vehicleType: '',
      services: '',
      washingPoint: '',
      nickname: '',
      phone: '',
      washDate: '',
      washTime: '',
      paymentType: '',
      notes: '',
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Submit booking
  submitBooking(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.bookingService.createBooking(this.bookingForm).subscribe(
      (booking) => {
        this.isSubmitting = false;
        this.successMessage = 'Booking created successfully!';
        this.loadBookings(); // Refresh the bookings list

        // Close modal after 2 seconds on success
        setTimeout(() => {
          this.closeBookingModal();
        }, 2000);
      },
      (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message;
      }
    );
  }

  // Validate form before submission
  validateForm(): boolean {
    if (!this.bookingForm.vehicleType) {
      this.errorMessage = 'Please select a vehicle type';
      return false;
    }

    if (!this.bookingForm.services) {
      this.errorMessage = 'Please select a service';
      return false;
    }

    if (!this.bookingForm.washingPoint) {
      this.errorMessage = 'Please select a washing point';
      return false;
    }

    if (!this.bookingForm.nickname) {
      this.errorMessage = 'Please enter your name';
      return false;
    }

    if (!this.bookingForm.phone) {
      this.errorMessage = 'Please enter your phone number';
      return false;
    }

    if (!this.bookingForm.washDate) {
      this.errorMessage = 'Please select a wash date';
      return false;
    }

    if (!this.bookingForm.washTime) {
      this.errorMessage = 'Please select a wash time';
      return false;
    }

    if (!this.bookingForm.paymentType) {
      this.errorMessage = 'Please select a payment type';
      return false;
    }

    return true;
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  // View booking details (in a real app, this might navigate to a details page)
  viewBooking(booking: Booking): void {
    alert(`Viewing booking details for ${booking.nickname}`);
  }

  // Pay for a booking
  payBooking(booking: Booking): void {
    this.bookingService.payForBooking(booking.id).subscribe((success) => {
      if (success) {
        this.loadBookings(); // Refresh the bookings list
      }
    });
  }

  // Cancel a booking
  cancelBooking(booking: Booking): void {
    if (confirm(`Are you sure you want to cancel this booking?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe((success) => {
        if (success) {
          this.loadBookings(); // Refresh the bookings list
        }
      });
    }
  }

  // Get status class for styling
  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'status-confirmed';
      case BookingStatus.COMPLETED:
        return 'status-completed';
      case BookingStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }
}
