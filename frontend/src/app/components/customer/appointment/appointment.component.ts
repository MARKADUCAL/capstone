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
import { MatIconModule } from '@angular/material/icon';
import {
  VEHICLE_TYPES,
  PAYMENT_TYPES,
  ONLINE_PAYMENT_OPTIONS,
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
    MatIconModule,
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

  // User information
  userFirstName = '';
  userLastName = '';
  userPhone = '';
  userCustomerId = ''; // Add customer ID property

  // Form options
  vehicleTypes = VEHICLE_TYPES;
  services: Service[] = [];
  paymentTypes = PAYMENT_TYPES;
  onlinePaymentOptions = ONLINE_PAYMENT_OPTIONS;

  // Booking form model
  bookingForm: BookingForm = {
    vehicleType: '',
    services: '',
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    additionalPhone: '',
    washDate: '',
    washTime: '',
    paymentType: '',
    onlinePaymentOption: '',
    notes: '',
  };

  // Customer bookings
  customerBookings: Booking[] = [];

  // Time picker properties
  showTimePicker = false;
  manualHour: number | null = null;
  manualMinute: number | null = null;
  availableTimeSlots: string[] = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

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
      this.loadUserData();
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

  // Handle payment type change
  onPaymentTypeChange(): void {
    if (this.bookingForm.paymentType !== 'Online Payment') {
      this.bookingForm.onlinePaymentOption = '';
    }
  }

  // Load user data from localStorage
  loadUserData(): void {
    if (!this.isBrowser) return;

    const customerDataStr = localStorage.getItem('customer_data');
    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);
        console.log('Loaded customer data:', customerData);

        // Set user data properties
        this.userFirstName = customerData.first_name || '';
        this.userLastName = customerData.last_name || '';
        this.userPhone = customerData.mobile_no || customerData.phone || '';
        this.userCustomerId = customerData.id || ''; // Get customer ID

        console.log('Customer ID loaded:', this.userCustomerId);

        // Pre-fill the form with user data
        this.bookingForm.firstName = this.userFirstName;
        this.bookingForm.lastName = this.userLastName;
        this.bookingForm.phone = this.userPhone;

        // Load bookings after user data is loaded
        this.loadBookings();
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    } else {
      console.warn('No customer data found in localStorage');
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
    if (!this.userCustomerId) {
      console.warn('Customer ID not available, skipping bookings load');
      return;
    }

    this.bookingService.getBookingsByCustomerId(this.userCustomerId).subscribe(
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
    if (!this.userCustomerId) {
      this.errorMessage = 'Customer ID not found. Please log in again.';
      return;
    }

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
      firstName: this.userFirstName,
      lastName: this.userLastName,
      nickname: '',
      phone: this.userPhone,
      additionalPhone: '',
      washDate: '',
      washTime: '',
      paymentType: '',
      onlinePaymentOption: '',
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

    // Get the actual customer_id from stored user data
    if (!this.userCustomerId) {
      this.errorMessage = 'Customer ID not found. Please log in again.';
      this.isSubmitting = false;
      return;
    }

    const bookingData = {
      customer_id: this.userCustomerId, // Use actual customer ID from user data
      service_id: selectedService.id,
      vehicle_type: this.bookingForm.vehicleType,
      first_name: this.bookingForm.firstName,
      last_name: this.bookingForm.lastName,
      nickname: this.bookingForm.nickname,
      phone: this.bookingForm.phone,
      additional_phone: this.bookingForm.additionalPhone,
      wash_date: this.bookingForm.washDate,
      wash_time: this.bookingForm.washTime,
      payment_type: this.bookingForm.paymentType,
      online_payment_option: this.bookingForm.onlinePaymentOption,
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

    if (!this.bookingForm.firstName) {
      this.errorMessage = 'First name is required';
      return false;
    }

    if (!this.bookingForm.lastName) {
      this.errorMessage = 'Last name is required';
      return false;
    }

    if (!this.bookingForm.nickname) {
      this.errorMessage = 'Please enter your nickname';
      return false;
    }

    if (!this.bookingForm.phone) {
      this.errorMessage = 'Phone number is required';
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

    if (
      this.bookingForm.paymentType === 'Online Payment' &&
      !this.bookingForm.onlinePaymentOption
    ) {
      this.errorMessage = 'Please select an online payment method';
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
      const reason = prompt(
        'Please share a short reason for cancelling (optional):',
        'Change of plans'
      );

      this.bookingService
        .updateBookingStatus(booking.id, 'Cancelled', reason || undefined)
        .subscribe({
          next: (result) => {
            if (result && result.success) {
              this.loadBookings(); // Refresh the bookings list
            } else {
              this.errorMessage = 'Failed to cancel booking.';
            }
          },
          error: () => {
            this.errorMessage = 'Failed to cancel booking.';
          },
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

  // Time picker methods
  openTimePicker(): void {
    this.showTimePicker = true;
    // Parse current time if exists
    if (this.bookingForm.washTime) {
      const [hours, minutes] = this.bookingForm.washTime.split(':');
      this.manualHour = parseInt(hours);
      this.manualMinute = parseInt(minutes);
    }
  }

  closeTimePicker(event: Event): void {
    event.stopPropagation();
    this.showTimePicker = false;
  }

  updateManualTime(): void {
    if (this.manualHour !== null && this.manualMinute !== null) {
      const hour = this.manualHour.toString().padStart(2, '0');
      const minute = this.manualMinute.toString().padStart(2, '0');
      this.bookingForm.washTime = `${hour}:${minute}`;
    }
  }

  selectTimeSlot(timeSlot: string): void {
    this.bookingForm.washTime = timeSlot;
    // Parse the selected time for manual inputs
    const [hours, minutes] = timeSlot.split(':');
    this.manualHour = parseInt(hours);
    this.manualMinute = parseInt(minutes);
  }

  isTimeSlotSelected(timeSlot: string): boolean {
    return this.bookingForm.washTime === timeSlot;
  }

  isTimeSlotAvailable(timeSlot: string): boolean {
    // In a real app, you would check against actual availability
    // For now, all slots are available
    return true;
  }

  formatTimeSlot(timeSlot: string): string {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  setQuickTime(time: string): void {
    this.bookingForm.washTime = time;
    const [hours, minutes] = time.split(':');
    this.manualHour = parseInt(hours);
    this.manualMinute = parseInt(minutes);
  }

  confirmTimeSelection(): void {
    this.showTimePicker = false;
  }
}
