import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Customer saved vehicles
  customerVehicles: any[] = [];
  filteredVehicles: any[] = [];
  selectedVehicleId: number | null = null;

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

      // Check for query parameters from pricing page
      this.route.queryParams.subscribe((params) => {
        const vehicleTypeCode = params['vehicle_type'];
        const servicePackageCode = params['service_package'];

        if (vehicleTypeCode && servicePackageCode) {
          // Convert codes to full descriptions and pre-select
          this.selectPricingFromCodes(vehicleTypeCode, servicePackageCode);
          // Store in localStorage for persistence
          this.saveSelectedPricing(vehicleTypeCode, servicePackageCode);
        } else {
          // Try to load from localStorage if no query params
          this.loadSelectedPricingFromStorage();
        }

        // Legacy support for 'service' query parameter
        if (params['service'] && !servicePackageCode) {
          setTimeout(() => {
            this.bookingForm.services = params['service'];
            this.calculatePrice();
          }, 500);
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
      return this.customerBookings.some((b: any) =>
        this.isActiveBookingStatus(b?.status)
      );
    } catch {
      return false;
    }
  }

  // Determine if a booking status should be treated as active
  private isActiveBookingStatus(status: unknown): boolean {
    if (typeof status !== 'string') return false;
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'pending' || normalizedStatus === 'approved';
  }

  // Normalize the plate number to compare regardless of casing/spaces
  private normalizePlate(plate: unknown): string {
    if (typeof plate !== 'string') return '';
    return plate.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  // Check if there's an active booking for the provided plate number
  private hasActiveBookingForPlate(plateNumber: string): boolean {
    const normalizedTargetPlate = this.normalizePlate(plateNumber);
    if (!normalizedTargetPlate) {
      return false;
    }

    try {
      return this.customerBookings.some((booking: any) => {
        if (!this.isActiveBookingStatus(booking?.status)) {
          return false;
        }
        const bookingPlate = this.normalizePlate(
          booking?.plate_number ?? booking?.plateNumber
        );
        return bookingPlate && bookingPlate === normalizedTargetPlate;
      });
    } catch {
      return false;
    }
  }

  // Find a saved vehicle by plate number (case/format insensitive)
  private findSavedVehicleByPlate(
    plateNumber: string
  ): Record<string, any> | null {
    const normalizedTargetPlate = this.normalizePlate(plateNumber);
    if (!normalizedTargetPlate) return null;

    const match = this.customerVehicles.find((vehicle: any) => {
      const normalizedVehiclePlate = this.normalizePlate(
        vehicle?.plate_number ?? vehicle?.plateNumber
      );
      return normalizedVehiclePlate === normalizedTargetPlate;
    });

    return match || null;
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
    this.loadCustomerVehiclesForType();
    // Reset selected vehicle when type changes manually (if it doesn't match)
    if (this.selectedVehicleId) {
      const selectedVehicle = this.customerVehicles.find(
        (v) => v.id === this.selectedVehicleId
      );
      if (
        selectedVehicle &&
        this.getVehicleTypeCode(this.bookingForm.vehicleType) !==
          selectedVehicle.vehicle_type
      ) {
        this.selectedVehicleId = null;
      }
    }
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
        // Load customer vehicles
        this.loadCustomerVehicles();
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

  // Load customer vehicles from database
  loadCustomerVehicles(): void {
    if (!this.isBrowser || !this.userCustomerId) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, cannot load vehicles');
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    this.http
      .get<any>(
        `${environment.apiUrl}/get_customer_vehicles?customer_id=${this.userCustomerId}`,
        { headers }
      )
      .subscribe({
        next: (response: any) => {
          if (response.status && response.status.remarks === 'success') {
            this.customerVehicles = response.payload?.vehicles || [];
            this.filterVehiclesByType();
          } else {
            console.error('Failed to load vehicles:', response.status?.message);
            this.customerVehicles = [];
            this.filteredVehicles = [];
          }
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.customerVehicles = [];
          this.filteredVehicles = [];
        },
      });
  }

  // Load and filter vehicles when vehicle type is selected
  loadCustomerVehiclesForType(): void {
    if (!this.bookingForm.vehicleType) {
      this.filteredVehicles = [];
      return;
    }

    // Extract vehicle type code from the selected type (e.g., "M - SUVs..." -> "M")
    const vehicleTypeCode = this.getVehicleTypeCode(
      this.bookingForm.vehicleType
    );

    // Filter vehicles by the selected vehicle type
    this.filteredVehicles = this.customerVehicles.filter(
      (vehicle) => vehicle.vehicle_type === vehicleTypeCode
    );
  }

  // Filter vehicles by current vehicle type
  filterVehiclesByType(): void {
    if (!this.bookingForm.vehicleType) {
      this.filteredVehicles = [];
      return;
    }

    const vehicleTypeCode = this.getVehicleTypeCode(
      this.bookingForm.vehicleType
    );
    this.filteredVehicles = this.customerVehicles.filter(
      (vehicle) => vehicle.vehicle_type === vehicleTypeCode
    );
  }

  // Handle saved vehicle selection
  onSavedVehicleSelect(vehicleId: number | null): void {
    if (!vehicleId || vehicleId === null || vehicleId === undefined) {
      this.selectedVehicleId = null;
      return;
    }

    // Ensure vehicleId is a number (handle string conversion)
    const id =
      typeof vehicleId === 'string' ? parseInt(vehicleId, 10) : vehicleId;

    const vehicle = this.customerVehicles.find((v) => v.id == id);
    if (vehicle) {
      this.selectedVehicleId = id;

      // Handle vehicle type - it might be stored as full description or just code
      let vehicleTypeToSet = '';

      // Check if vehicle_type is already in the vehicleTypes array (full description)
      if (this.vehicleTypes.includes(vehicle.vehicle_type)) {
        vehicleTypeToSet = vehicle.vehicle_type;
      } else {
        // Try to extract code from description (e.g., "S" from "S - Sedans...")
        const codeMatch = vehicle.vehicle_type.match(/^([A-Z]+)\s*-\s*/);
        if (codeMatch) {
          const vehicleTypeCode = codeMatch[1];
          const vehicleTypeIndex =
            this.vehicleTypeCodes.indexOf(vehicleTypeCode);
          if (
            vehicleTypeIndex >= 0 &&
            vehicleTypeIndex < this.vehicleTypes.length
          ) {
            vehicleTypeToSet = this.vehicleTypes[vehicleTypeIndex];
          }
        } else {
          // Try direct code match
          const vehicleTypeIndex = this.vehicleTypeCodes.indexOf(
            vehicle.vehicle_type
          );
          if (
            vehicleTypeIndex >= 0 &&
            vehicleTypeIndex < this.vehicleTypes.length
          ) {
            vehicleTypeToSet = this.vehicleTypes[vehicleTypeIndex];
          }
        }
      }

      // Set vehicle type
      if (vehicleTypeToSet) {
        this.bookingForm.vehicleType = vehicleTypeToSet;
      } else {
        console.warn('Could not match vehicle type:', vehicle.vehicle_type);
        // Fallback: try to use the stored value directly
        this.bookingForm.vehicleType = vehicle.vehicle_type;
      }

      // Auto-fill all form fields with selected vehicle data
      this.bookingForm.plateNumber = vehicle.plate_number || '';
      this.bookingForm.vehicleModel = vehicle.vehicle_model || '';
      this.bookingForm.vehicleColor = vehicle.vehicle_color || '';
      this.bookingForm.nickname = vehicle.nickname || '';

      // Recalculate price after setting vehicle type
      this.calculatePrice();
    } else {
      console.error('Vehicle not found with ID:', id);
      this.selectedVehicleId = null;
    }
  }

  // Clear selected vehicle and reset form fields
  clearSavedVehicleSelection(): void {
    this.selectedVehicleId = null;
    // Optionally clear the vehicle fields or keep them filled
    // this.bookingForm.plateNumber = '';
    // this.bookingForm.vehicleModel = '';
    // this.bookingForm.vehicleColor = '';
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
    this.selectedVehicleId = null;
    this.filteredVehicles = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Submit booking
  submitBooking(): void {
    if (!this.validateForm()) {
      return;
    }

    // Prevent creating a new booking for the same vehicle when one is active
    if (this.hasActiveBookingForPlate(this.bookingForm.plateNumber)) {
      const msg =
        'You already have an active booking for this vehicle. Please wait until it’s completed, cancelled, or declined before booking it again.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'info',
        title: 'Vehicle already booked',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

    // Ensure the selected plate belongs to one of the user's saved vehicles
    const savedVehicle = this.findSavedVehicleByPlate(
      this.bookingForm.plateNumber
    );
    if (!savedVehicle) {
      const msg =
        'Please select one of your saved vehicles from your profile before booking.';
      this.errorMessage = msg;
      Swal.fire({
        icon: 'info',
        title: 'Vehicle not found',
        text: msg,
        confirmButtonColor: '#3498db',
      });
      return;
    }

    // Keep the booking form aligned with the saved vehicle data
    this.bookingForm.vehicleModel = savedVehicle.vehicle_model || '';
    this.bookingForm.vehicleColor = savedVehicle.vehicle_color || '';
    this.bookingForm.nickname = savedVehicle.nickname || '';

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

        // Clear selected pricing from localStorage after successful booking
        this.clearSelectedPricing();

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
    // Check if customer has saved vehicles
    if (this.customerVehicles.length === 0) {
      this.errorMessage = 'Please add a vehicle to your profile before booking';
      return false;
    }

    // Check if a saved vehicle is selected (handle both number and string types)
    const hasSelectedVehicle =
      this.selectedVehicleId !== null &&
      this.selectedVehicleId !== undefined &&
      this.selectedVehicleId !== 0;

    if (!hasSelectedVehicle) {
      this.errorMessage = 'Please select a saved vehicle';
      return false;
    }

    // Verify vehicle exists and set vehicle type if missing
    const vehicle = this.customerVehicles.find(
      (v) => v.id == this.selectedVehicleId
    );

    if (!vehicle) {
      this.errorMessage = 'Selected vehicle not found. Please select again.';
      return false;
    }

    // Ensure vehicle type is set (should be auto-set from saved vehicle)
    if (!this.bookingForm.vehicleType) {
      // If vehicle type is not set, set it from the selected vehicle
      let vehicleTypeToSet = '';

      // Check if vehicle_type is already in the vehicleTypes array (full description)
      if (this.vehicleTypes.includes(vehicle.vehicle_type)) {
        vehicleTypeToSet = vehicle.vehicle_type;
      } else {
        // Try to extract code from description (e.g., "S" from "S - Sedans...")
        const codeMatch = vehicle.vehicle_type.match(/^([A-Z]+)\s*-\s*/);
        if (codeMatch) {
          const vehicleTypeCode = codeMatch[1];
          const vehicleTypeIndex =
            this.vehicleTypeCodes.indexOf(vehicleTypeCode);
          if (
            vehicleTypeIndex >= 0 &&
            vehicleTypeIndex < this.vehicleTypes.length
          ) {
            vehicleTypeToSet = this.vehicleTypes[vehicleTypeIndex];
          }
        } else {
          // Try direct code match
          const vehicleTypeIndex = this.vehicleTypeCodes.indexOf(
            vehicle.vehicle_type
          );
          if (
            vehicleTypeIndex >= 0 &&
            vehicleTypeIndex < this.vehicleTypes.length
          ) {
            vehicleTypeToSet = this.vehicleTypes[vehicleTypeIndex];
          }
        }
      }

      if (vehicleTypeToSet) {
        this.bookingForm.vehicleType = vehicleTypeToSet;
      } else {
        // Fallback: use stored value directly
        this.bookingForm.vehicleType = vehicle.vehicle_type;
      }
    }

    // Ensure vehicle information is set (should be auto-set from saved vehicle)
    if (!this.bookingForm.plateNumber && vehicle.plate_number) {
      this.bookingForm.plateNumber = vehicle.plate_number;
    }

    if (!this.bookingForm.vehicleModel && vehicle.vehicle_model) {
      this.bookingForm.vehicleModel = vehicle.vehicle_model;
    }

    if (!this.bookingForm.vehicleColor && vehicle.vehicle_color) {
      this.bookingForm.vehicleColor = vehicle.vehicle_color;
    }

    if (!this.bookingForm.nickname && vehicle.nickname) {
      this.bookingForm.nickname = vehicle.nickname;
    }

    // Ensure the plate number still matches the selected saved vehicle
    if (
      this.normalizePlate(this.bookingForm.plateNumber) !==
      this.normalizePlate(vehicle.plate_number)
    ) {
      this.errorMessage =
        'Please use the plate number stored in your profile for the selected vehicle.';
      return false;
    }

    if (!this.bookingForm.services) {
      this.errorMessage = 'Please select a service';
      return false;
    }

    // Verify vehicle type is set (final check)
    if (!this.bookingForm.vehicleType) {
      this.errorMessage = 'Vehicle type is required';
      return false;
    }

    // Verify vehicle information is set (should be auto-set from saved vehicle)
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

  // Convert vehicle type code to full description
  private getVehicleTypeFromCode(code: string): string {
    const index = this.vehicleTypeCodes.indexOf(code);
    if (index >= 0 && index < this.vehicleTypes.length) {
      return this.vehicleTypes[index];
    }
    return '';
  }

  // Convert service package code to full description
  private getServicePackageFromCode(code: string): string {
    const index = this.serviceCodes.indexOf(code);
    if (index >= 0 && index < this.servicePackages.length) {
      return this.servicePackages[index];
    }
    return '';
  }

  // Select pricing options from codes (used when navigating from pricing page)
  private selectPricingFromCodes(
    vehicleTypeCode: string,
    servicePackageCode: string
  ): void {
    const vehicleType = this.getVehicleTypeFromCode(vehicleTypeCode);
    const servicePackage = this.getServicePackageFromCode(servicePackageCode);

    if (vehicleType && servicePackage) {
      // Wait for pricing data to load before setting selections
      const attemptSelection = (attempts: number = 0) => {
        const maxAttempts = 10; // Try for up to 5 seconds (10 * 500ms)

        // Check if pricing matrix is loaded (has at least one vehicle type)
        if (
          Object.keys(this.pricingMatrix).length > 0 ||
          attempts >= maxAttempts
        ) {
          this.bookingForm.vehicleType = vehicleType;
          this.bookingForm.services = servicePackage;
          this.calculatePrice();
        } else {
          // Retry after 500ms
          setTimeout(() => attemptSelection(attempts + 1), 500);
        }
      };

      attemptSelection();
    }
  }

  // Save selected pricing to localStorage for persistence
  private saveSelectedPricing(
    vehicleTypeCode: string,
    servicePackageCode: string
  ): void {
    if (!this.isBrowser) return;
    try {
      const pricingSelection = {
        vehicle_type: vehicleTypeCode,
        service_package: servicePackageCode,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        'selected_pricing',
        JSON.stringify(pricingSelection)
      );
    } catch (error) {
      console.error('Error saving pricing selection to localStorage:', error);
    }
  }

  // Load selected pricing from localStorage
  private loadSelectedPricingFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      const stored = localStorage.getItem('selected_pricing');
      if (stored) {
        const pricingSelection = JSON.parse(stored);
        // Only use stored selection if it's less than 1 hour old (to avoid stale data)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - pricingSelection.timestamp < oneHour) {
          this.selectPricingFromCodes(
            pricingSelection.vehicle_type,
            pricingSelection.service_package
          );
        } else {
          // Clear stale data
          localStorage.removeItem('selected_pricing');
        }
      }
    } catch (error) {
      console.error(
        'Error loading pricing selection from localStorage:',
        error
      );
    }
  }

  // Clear selected pricing from localStorage (call after successful booking)
  private clearSelectedPricing(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('selected_pricing');
    } catch (error) {
      console.error(
        'Error clearing pricing selection from localStorage:',
        error
      );
    }
  }
}
