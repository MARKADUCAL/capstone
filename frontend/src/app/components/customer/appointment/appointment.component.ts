import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import Swal from 'sweetalert2';
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
  // When a selected combination exists but is inactive/not available
  isUnavailableSelection = false;

  // Booking form model
  bookingForm: BookingForm = {
    vehicleType: '',
    services: '',
    plateNumber: '',
    vehicleModel: '',
    vehicleColor: '',
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
  selectedHour = 8; // Default to 8 AM
  selectedMinute = '00';
  selectedPeriod = 'AM';
  availableHours: number[] = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8]; // 8 AM to 8 PM
  availableMinutes: string[] = ['00', '15', '30', '45'];
  availablePeriods: string[] = ['AM', 'PM'];

  // Date/time guards
  minDate: Date = new Date();

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

  // Helper: return min time (HH:MM) if selected date is today; else null (no limit)
  minTimeForSelectedDate(): string | null {
    try {
      if (!this.bookingForm.washDate) return null;
      const selected = new Date(this.bookingForm.washDate);
      const now = new Date();
      if (
        selected.getFullYear() === now.getFullYear() &&
        selected.getMonth() === now.getMonth() &&
        selected.getDate() === now.getDate()
      ) {
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Guard: ensure selected date/time are not in the past
  private isDateTimeInPast(dateStr: string, timeStr: string): boolean {
    if (!dateStr || !timeStr) return false;
    try {
      const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
      const d = new Date(dateStr);
      d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
      const now = new Date();
      return d.getTime() < now.getTime();
    } catch {
      return false;
    }
  }

  // Check if customer has an active booking (Pending or Approved)
  private hasActiveBooking(): boolean {
    try {
      if (!Array.isArray(this.customerBookings)) return false;
      const activeStatuses = new Set([
        'Pending',
        'Approved',
        // handle possible lowercase backend or enum mappings just in case
        'pending',
        'approved',
      ]);
      return this.customerBookings.some((b: any) =>
        activeStatuses.has(b?.status)
      );
    } catch {
      return false;
    }
  }

  // Normalize a date-like value to local YYYY-MM-DD (no timezone shift)
  private normalizeWashDateForApi(dateValue: unknown): string {
    try {
      if (!dateValue) return '';
      // If already in YYYY-MM-DD, keep it
      if (
        typeof dateValue === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        return dateValue;
      }
      const d = new Date(dateValue as any);
      // Use local components to avoid UTC conversion issues
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }

  // Normalize time to HH:MM:SS
  private normalizeWashTimeForApi(timeValue: string): string {
    if (!timeValue) return '';
    try {
      const [h, m] = timeValue.split(':');
      const hh = (h ?? '').padStart(2, '0');
      const mm = (m ?? '00').padStart(2, '0');
      return `${hh}:${mm}:00`;
    } catch {
      return timeValue;
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
    this.isUnavailableSelection = false;
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
      // If both selections are present but no price found, mark as unavailable
      if (vehicleCode && serviceCode) {
        this.isUnavailableSelection = true;
      }
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
    if (this.hasActiveBooking()) {
      const msg =
        'You already have an active booking. Please wait until it’s completed, cancelled, or declined before making a new one.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'info',
        title: 'Active booking found',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

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
      plateNumber: '',
      vehicleModel: '',
      vehicleColor: '',
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

    // Prevent creating a new booking when an active one exists
    if (this.hasActiveBooking()) {
      const msg =
        'You already have an active booking. Please wait until it’s completed, cancelled, or declined before making a new one.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'info',
        title: 'Active booking found',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

    // Prevent booking in the past (date or time)
    if (
      this.isDateTimeInPast(
        this.bookingForm.washDate,
        this.bookingForm.washTime
      )
    ) {
      this.errorMessage = 'Please select a future date and time.';
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

    // Extract service package code (e.g., 'p1' from 'p1 - Wash only')
    const servicePackageCode = this.bookingForm.services.split(' - ')[0];

    const bookingData = {
      customer_id: this.userCustomerId, // Use actual customer ID from user data
      vehicle_type: vehicleTypeCode,
      service_package: servicePackageCode,
      plate_number: this.bookingForm.plateNumber,
      vehicle_model: this.bookingForm.vehicleModel,
      vehicle_color: this.bookingForm.vehicleColor || '',
      first_name: this.bookingForm.firstName,
      last_name: this.bookingForm.lastName,
      nickname: this.bookingForm.nickname,
      phone: this.bookingForm.phone,
      additional_phone: this.bookingForm.additionalPhone,
      wash_date: this.normalizeWashDateForApi(this.bookingForm.washDate),
      wash_time: this.normalizeWashTimeForApi(this.bookingForm.washTime),
      payment_type: this.bookingForm.paymentType,
      online_payment_option: this.bookingForm.onlinePaymentOption,
      notes: this.bookingForm.notes,
    };

    this.bookingService.createBooking(bookingData).subscribe(
      (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Booking created successfully!';
        this.loadBookings(); // Refresh the bookings list

        Swal.fire({
          icon: 'success',
          title: 'Booking created',
          text: 'Your booking has been submitted successfully.',
          confirmButtonColor: '#3498db',
        });

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

    if (!this.bookingForm.plateNumber) {
      this.errorMessage = 'Plate number is required';
      return false;
    }

    if (!this.bookingForm.vehicleModel) {
      this.errorMessage = 'Vehicle model is required';
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

    // Validate wash time is within business hours (8:00 AM to 8:00 PM)
    try {
      const [hours, minutes] = this.bookingForm.washTime
        .split(':')
        .map((v) => parseInt(v, 10));
      if (hours < 8 || hours > 20) {
        const msg =
          'Selected time is not available. Please choose between 8:00 AM and 8:00 PM.';
        this.errorMessage = msg;
        alert(msg);
        return false;
      }
    } catch {
      this.errorMessage = 'Invalid wash time format';
      return false;
    }

    // Validate: washDate cannot be in the past
    try {
      const today = new Date();
      const selected = new Date(this.bookingForm.washDate);
      // Normalize both dates to midnight for date-only comparison
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected.getTime() < today.getTime()) {
        this.errorMessage = 'Wash date cannot be in the past';
        return false;
      }
    } catch {}

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
    // If it's already YYYY-MM-DD, format using local components to avoid UTC shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d] = dateString.split('-').map((v) => parseInt(v, 10));
      const localDate = new Date(y, (m || 1) - 1, d || 1);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return localDate.toLocaleDateString(undefined, options);
    }
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  // Format price for pricing matrix cell
  formatPrice(vehicleCode: string, serviceCode: string): string {
    try {
      const value = this.pricingMatrix?.[vehicleCode]?.[serviceCode];
      if (value === undefined || value === null || value === '') {
        return 'N/A';
      }
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(num)) return 'N/A';
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return 'N/A';
    }
  }

  // View booking details (in a real app, this might navigate to a details page)
  viewBooking(booking: Booking): void {
    const displayName = booking.nickname || booking.firstName || 'this booking';
    alert(`Viewing booking details for ${displayName}`);
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
    if (!this.isHourDisabledForCurrentPeriod(hour)) {
      this.selectedHour = hour;
    }
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

    // Validate time is within 8:00 AM to 8:00 PM range
    if (hour24 < 8 || hour24 > 20) {
      const msg =
        'Selected time is not available. Please choose between 8:00 AM and 8:00 PM.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'warning',
        title: 'Time not available',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

    // Format time as HH:MM
    const formattedHour = hour24.toString().padStart(2, '0');
    const formattedMinute = this.selectedMinute.toString().padStart(2, '0');

    // If selected date is today, clamp to current time if needed
    const minTime = this.minTimeForSelectedDate();
    let finalTime = `${formattedHour}:${formattedMinute}`;
    if (minTime) {
      // Compare HH:MM strings lexicographically works because both are zero-padded
      if (finalTime < minTime) {
        finalTime = minTime;
      }
    }

    // Final validation: ensure the final time is still within business hours
    const finalHour24 = parseInt(finalTime.split(':')[0]);
    if (finalHour24 < 8 || finalHour24 > 20) {
      const msg =
        'Selected time is not available. Please choose between 8:00 AM and 8:00 PM.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'warning',
        title: 'Time not available',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

    this.bookingForm.washTime = finalTime;
    this.showTimePicker = false;
  }

  // Compute effective min time for the native time input
  effectiveMinTime(): string | null {
    const businessMin = '08:00';
    const businessMax = '20:00';
    const todayMin = this.minTimeForSelectedDate();
    if (!todayMin) return businessMin;
    // Clamp to business window
    const minClamped = todayMin < businessMin ? businessMin : todayMin;
    return minClamped > businessMax ? businessMax : minClamped;
  }

  // Handle manual/native time input changes
  onTimeInputChange(value: string): void {
    this.errorMessage = '';
    if (!value) return;
    try {
      const [hStr, mStr] = value.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return;
      if (h < 8 || h > 20) {
        const msg =
          'Selected time is not available. Please choose between 8:00 AM and 8:00 PM.';
        this.errorMessage = msg;
        Swal.fire({
          icon: 'warning',
          title: 'Time not available',
          text: msg,
          confirmButtonColor: '#3498db',
        });
        // Do not clear the field; allow browser min/max UI to guide
        return;
      }
      this.bookingForm.washTime = `${hStr.padStart(2, '0')}:${mStr.padStart(
        2,
        '0'
      )}`;
    } catch {}
  }

  // Disable hours that are invalid for the currently selected period
  isHourDisabledForCurrentPeriod(hour: number): boolean {
    if (this.selectedPeriod === 'AM') {
      // AM allows 8,9,10,11 only
      return !(hour >= 8 && hour <= 11);
    }
    // PM allows 12,1..8
    return false;
  }
}
