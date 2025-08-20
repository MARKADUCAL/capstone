import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  Booking,
  BookingStatus,
} from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ServiceService, Service } from '../../../services/service.service';

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
  isBrowser: boolean;

  // Form options
  vehicleTypes = VEHICLE_TYPES;
  services: Service[] = [];
  paymentTypes = PAYMENT_TYPES;

  // Booking form model
  bookingForm: BookingForm = {
    vehicleType: '',
    services: '',
    nickname: '',
    phone: '',
    washDate: '',
    washTime: '',
    paymentType: '',
    notes: '',
  };

  // Customer bookings
  customerBookings: Booking[] = [];

  constructor(
    private bookingService: BookingService,
    private serviceService: ServiceService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadBookings();
      this.loadServices();

      // Check for service query parameter
      this.route.queryParams.subscribe((params) => {
        if (params['service']) {
          // Pre-select the service when navigating from dashboard
          setTimeout(() => {
            this.bookingForm.services = params['service'];
            this.openBookingModal();
          }, 500); // Small delay to ensure services are loaded
        }
      });
    }
  }

  // Load services from API
  loadServices(): void {
    this.serviceService.getAllServices().subscribe(
      (services) => {
        this.services = services;
      },
      (error) => {
        this.errorMessage = 'Failed to load services: ' + error.message;
      }
    );
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

    const selectedService = this.services.find(
      (s) => s.name === this.bookingForm.services
    );

    if (!selectedService) {
      this.errorMessage = 'Invalid service selected.';
      this.isSubmitting = false;
      return;
    }

    // TODO: Get the actual customer_id from auth service
    const bookingData = {
      customer_id: 2, // Hardcoded customer_id
      service_id: selectedService.id,
      vehicle_type: this.bookingForm.vehicleType,
      nickname: this.bookingForm.nickname,
      phone: this.bookingForm.phone,
      wash_date: this.bookingForm.washDate,
      wash_time: this.bookingForm.washTime,
      payment_type: this.bookingForm.paymentType,
      price: selectedService.price,
      notes: this.bookingForm.notes,
    };

    this.bookingService.createBooking(bookingData).subscribe(
      (response) => {
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
