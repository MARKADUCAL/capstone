import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  VEHICLE_TYPE_CODES,
  SERVICE_PACKAGES,
  SERVICE_CODES,
  PAYMENT_TYPES,
  ONLINE_PAYMENT_OPTIONS,
  BookingForm,
  Booking,
  BookingStatus,
  PricingInfo,
} from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ServiceService, Service } from '../../../services/service.service';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  vehicleTypeCodes = VEHICLE_TYPE_CODES;
  servicePackages = SERVICE_PACKAGES;
  serviceCodes = SERVICE_CODES;
  paymentTypes = PAYMENT_TYPES;
  onlinePaymentOptions = ONLINE_PAYMENT_OPTIONS;

  // Pricing
  selectedPrice: number | null = null;
  pricingMatrix: any = {}; // Property to store pricing matrix from database

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
  selectedHour = 12;
  selectedMinute = '00';
  selectedPeriod = 'AM';
  availableHours: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  availableMinutes: string[] = ['00', '15', '30', '45'];
  availablePeriods: string[] = ['AM', 'PM'];

  constructor(
    private bookingService: BookingService,
    private serviceService: ServiceService,
    private route: ActivatedRoute,
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadUserData();
      this.loadPricingData(); // Load pricing data from database

      // Check for service query parameter
      this.route.queryParams.subscribe((params) => {
        if (params['service']) {
          // Pre-select the service when navigating from dashboard
          setTimeout(() => {
            this.bookingForm.services = params['service'];
            this.calculatePrice();
          }, 500); // Small delay to ensure services are loaded
        }
      });
    }
  }

  // Load pricing data from database
  loadPricingData(): void {
    if (this.isBrowser) {
      console.log(
        'Loading pricing data from:',
        `${environment.apiUrl}/get_pricing_matrix`
      );
      this.http.get<any>(`${environment.apiUrl}/get_pricing_matrix`).subscribe({
        next: (response) => {
          console.log('Raw API response:', response);
          if (response.status && response.status.remarks === 'success') {
            this.pricingMatrix = response.payload.pricing_matrix || {};
            console.log('Loaded pricing matrix:', this.pricingMatrix);
          } else {
            console.error('Failed to load pricing matrix:', response);
            this.pricingMatrix = {};
          }
        },
        error: (error) => {
          console.error('Error loading pricing matrix:', error);
          this.pricingMatrix = {};
        },
      });
    }
  }

  // Get vehicle type code from full description
  getVehicleTypeCode(vehicleType: string): string {
    if (!vehicleType) return '';
    const index = this.vehicleTypes.indexOf(vehicleType);
    if (index >= 0) {
      return this.vehicleTypeCodes[index];
    }
    // Fallback: try to extract code from the string
    const match = vehicleType.match(/^([A-Z]+)\s*-\s*/);
    return match ? match[1] : '';
  }

  // Get service code from full description
  getServiceCode(service: string): string {
    if (!service) return '';
    const index = this.servicePackages.indexOf(service);
    if (index >= 0) {
      return this.serviceCodes[index];
    }
    // Fallback: try to extract code from the string
    const match = service.match(/^([0-9.]+)\s*-\s*/);
    return match ? match[1] : '';
  }

  // Calculate price based on vehicle type and service
  calculatePrice(): void {
    console.log(
      'Calculating price for:',
      this.bookingForm.vehicleType,
      this.bookingForm.services
    );
    const vehicleCode = this.getVehicleTypeCode(this.bookingForm.vehicleType);
    const serviceCode = this.getServiceCode(this.bookingForm.services);
    console.log('Extracted codes:', vehicleCode, serviceCode);
    console.log('Current pricing matrix:', this.pricingMatrix);

    // Get price from database pricing matrix
    if (
      vehicleCode &&
      serviceCode &&
      this.pricingMatrix[vehicleCode] &&
      this.pricingMatrix[vehicleCode][serviceCode]
    ) {
      this.selectedPrice = this.pricingMatrix[vehicleCode][serviceCode];
      console.log(
        `Price for ${vehicleCode} - ${serviceCode}: ${this.selectedPrice}`
      );
    } else {
      this.selectedPrice = null;
      console.log(`No price found for ${vehicleCode} - ${serviceCode}`);
      console.log('Available vehicle codes:', Object.keys(this.pricingMatrix));
      if (this.pricingMatrix[vehicleCode]) {
        console.log(
          'Available service codes for',
          vehicleCode,
          ':',
          Object.keys(this.pricingMatrix[vehicleCode])
        );
      }
    }
  }

  // Handle vehicle type change
  onVehicleTypeChange(): void {
    this.calculatePrice();
  }

  // Handle service change
  onServiceChange(): void {
    this.calculatePrice();
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

    // Calculate price based on vehicle type and service
    this.calculatePrice();

    if (!this.selectedPrice) {
      this.errorMessage =
        'Unable to calculate price. Please check your selections.';
      this.isSubmitting = false;
      return;
    }

    // Get the actual customer_id from stored user data
    if (!this.userCustomerId) {
      this.errorMessage = 'Customer ID not found. Please log in again.';
      this.isSubmitting = false;
      return;
    }

    // Extract vehicle type code (e.g., 'S' from 'S - Small Hatchbacks...')
    const vehicleTypeCode = this.bookingForm.vehicleType.split(' - ')[0];

    // Extract service package code (e.g., '1' from '1 - Body Wash')
    const servicePackageCode = this.bookingForm.services.split(' - ')[0];

    const bookingData = {
      customer_id: this.userCustomerId, // Use actual customer ID from user data
      vehicle_type: vehicleTypeCode,
      service_package: servicePackageCode,
      first_name: this.bookingForm.firstName,
      last_name: this.bookingForm.lastName,
      nickname: this.bookingForm.nickname,
      phone: this.bookingForm.phone,
      additional_phone: this.bookingForm.additionalPhone,
      wash_date: this.bookingForm.washDate,
      wash_time: this.bookingForm.washTime,
      payment_type: this.bookingForm.paymentType,
      online_payment_option: this.bookingForm.onlinePaymentOption,
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
      const timeParts = this.bookingForm.washTime.split(':');
      if (timeParts.length === 2) {
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]);
        this.selectedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        this.selectedMinute = minute.toString().padStart(2, '0');
        this.selectedPeriod = hour >= 12 ? 'PM' : 'AM';
      }
    }
  }

  closeTimePicker(event: Event): void {
    event.stopPropagation();
    this.showTimePicker = false;
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
  }

  selectMinute(minute: string): void {
    this.selectedMinute = minute;
  }

  selectPeriod(period: string): void {
    this.selectedPeriod = period;
  }

  confirmTimeSelection(): void {
    // Convert 12-hour format to 24-hour format
    let hour24 = this.selectedHour;
    if (this.selectedPeriod === 'PM' && this.selectedHour !== 12) {
      hour24 += 12;
    } else if (this.selectedPeriod === 'AM' && this.selectedHour === 12) {
      hour24 = 0;
    }

    // Format time as HH:MM
    const formattedHour = hour24.toString().padStart(2, '0');
    const formattedMinute = this.selectedMinute.toString().padStart(2, '0');

    this.bookingForm.washTime = `${formattedHour}:${formattedMinute}`;
    this.showTimePicker = false;
  }
}
