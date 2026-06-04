import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiCacheService } from '../../../services/api-cache.service';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { pageEntranceAnimation } from '../../../animations/page-animations';

interface PricingEntry {
  id: number;
  vehicle_type: string;
  service_package: string;
  price: number;
  is_active: boolean;
}

interface PricingMatrix {
  [vehicleType: string]: { [servicePackage: string]: number };
}

@Component({
  selector: 'app-services-pricing',
  imports: [CommonModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css',
  standalone: true,
  animations: [pageEntranceAnimation],
})
export class ServicesPricingComponent implements OnInit, OnDestroy {
  customerName: string = 'Customer';
  customerId: string = '';
  loading: boolean = false;
  error: string = '';
  isBrowser: boolean;
  showServicesModal: boolean = false;
  userVehicles: any[] = [];
  loadingVehicles: boolean = false;
  selectedVehicleId: number | null = null;
  recentBookings: Booking[] = [];
  loadingRecentBookings: boolean = false;
  recentBookingsError: string = '';
  private servicePackagesLoaded = false;
  private pricingLoaded = false;
  private vehiclesLoaded = false;
  private recentBookingsLoaded = false;
  private readonly handleProfileUpdateBound =
    this.handleProfileUpdate.bind(this);

  // Vehicle types with descriptions
  vehicleTypes = [
    { code: 'S', description: 'Sedans (all sedan types)' },
    { code: 'M', description: 'SUVs (all SUV types)' },
    { code: 'L', description: 'VANs (any type of van)' },
    {
      code: 'XL',
      description: 'Larger than vans (big SUVs/pickups, oversized vehicles)',
    },
  ];

  // Service packages with descriptions - loaded from database
  servicePackages: any[] = [];

  // Empty pricing matrix (will be populated from database)
  defaultPricingMatrix: PricingMatrix = {};

  pricingMatrix: PricingMatrix = {};
  pricingEntries: PricingEntry[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private apiCache: ApiCacheService,
    private bookingService: BookingService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCustomerData();
      this.loadServicePackages();
      this.loadPricingData();
      this.loadUserVehicles();
      this.loadRecentBookings();

      // Listen for profile updates
      window.addEventListener(
        'customerProfileUpdated',
        this.handleProfileUpdateBound,
      );
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener(
        'customerProfileUpdated',
        this.handleProfileUpdateBound,
      );
    }
  }

  private handleProfileUpdate(event: any): void {
    // Reload customer data from localStorage
    this.loadCustomerData();
  }

  // Load customer data from localStorage
  loadCustomerData(): void {
    if (!this.isBrowser) return;

    const customerDataStr = localStorage.getItem('customer_data');
    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);
        this.customerName = `${customerData.first_name || ''} ${
          customerData.last_name || ''
        }`.trim();
        if (!this.customerName) this.customerName = 'Customer';
        this.customerId = customerData.id || customerData.customer_id || '';
      } catch (error) {
        this.error =
          'Failed to load customer information. Please log in again.';
      }
    } else {
      this.error = 'Please log in to view pricing.';
    }
  }

  loadServicePackages(): void {
    if (this.servicePackagesLoaded) return;
    this.servicePackagesLoaded = true;
    this.apiCache.get<any>(`${environment.apiUrl}/get_packages`).subscribe({
      next: (response) => {
        if (response.status && response.status.remarks === 'success') {
          this.servicePackages = response.payload.packages || [];
        } else {
          this.servicePackages = [];
        }
      },
      error: (error) => {
        this.servicePackages = [];
        this.servicePackagesLoaded = false;
      },
    });
  }

  loadPricingData(): void {
    if (this.pricingLoaded || this.loading) return;
    this.loading = true;
    this.error = '';

    // Load pricing from database
    this.apiCache
      .get<any>(`${environment.apiUrl}/get_pricing_matrix`)
      .subscribe({
        next: (response) => {
          if (response.status && response.status.remarks === 'success') {
            this.pricingMatrix = response.payload.pricing_matrix || {};
          } else {
            this.pricingMatrix = {};
          }
          this.pricingLoaded = true;
          this.loading = false;
        },
        error: (error) => {
          this.pricingMatrix = {};
          this.loading = false;
          this.pricingLoaded = false;
        },
      });
  }

  navigateToAppointment(): void {
    if (this.selectedVehicleId) {
      this.router.navigate(['/customer-view/appointment'], {
        queryParams: { vehicle_id: this.selectedVehicleId },
      });
    } else {
      this.router.navigate(['/customer-view/appointment']);
    }
  }

  loadUserVehicles(): void {
    if (!this.customerId) return;
    if (this.vehiclesLoaded || this.loadingVehicles) return;

    this.loadingVehicles = true;
    this.apiCache
      .get<any>(
        `${environment.apiUrl}/get_customer_vehicles?customer_id=${this.customerId}`,
      )
      .subscribe({
        next: (response) => {
          if (response.status && response.status.remarks === 'success') {
            this.userVehicles = response.payload.vehicles || [];
          }
          this.vehiclesLoaded = true;
          this.loadingVehicles = false;
        },
        error: (error) => {
          this.userVehicles = [];
          this.loadingVehicles = false;
          this.vehiclesLoaded = false;
        },
      });
  }

  loadRecentBookings(): void {
    if (!this.customerId) return;
    if (this.recentBookingsLoaded || this.loadingRecentBookings) return;

    this.loadingRecentBookings = true;
    this.recentBookingsError = '';

    this.bookingService.getBookingsByCustomerId(this.customerId).subscribe({
      next: (bookings) => {
        this.recentBookings = (bookings || [])
          .sort(
            (a, b) => this.getBookingSortTime(b) - this.getBookingSortTime(a),
          )
          .slice(0, 3);
        this.recentBookingsLoaded = true;
        this.loadingRecentBookings = false;
      },
      error: (error) => {
        this.recentBookings = [];
        this.recentBookingsError =
          error?.message || 'Unable to load recent bookings.';
        this.loadingRecentBookings = false;
        this.recentBookingsLoaded = false;
      },
    });
  }

  private getBookingSortTime(booking: Booking): number {
    const bookingDate = (booking as any).washDate || (booking as any).wash_date;
    const bookingTime =
      (booking as any).washTime || (booking as any).wash_time || '00:00';
    const createdDate =
      (booking as any).dateCreated || (booking as any).date_created;
    const dateValue = bookingDate
      ? `${bookingDate}T${bookingTime}`
      : createdDate;
    const time = new Date(dateValue).getTime();
    return isNaN(time) ? 0 : time;
  }

  getBookingServiceName(booking: Booking): string {
    return (
      (booking as any).serviceName ||
      (booking as any).service_name ||
      (booking as any).services ||
      (booking as any).servicePackage ||
      (booking as any).service_package ||
      'Car wash service'
    );
  }

  getBookingVehicle(booking: Booking): string {
    return (
      (booking as any).nickname ||
      (booking as any).vehicleModel ||
      (booking as any).vehicle_model ||
      (booking as any).plateNumber ||
      (booking as any).plate_number ||
      'Vehicle'
    );
  }

  getBookingDateTime(booking: Booking): string {
    const date = (booking as any).washDate || (booking as any).wash_date;
    const time = (booking as any).washTime || (booking as any).wash_time;

    if (!date) return 'Schedule not set';

    const parsedDate = new Date(`${date}T${time || '00:00'}`);
    if (isNaN(parsedDate.getTime()))
      return `${date}${time ? ' • ' + time : ''}`;

    const dateText = parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return time ? `${dateText} • ${time}` : dateText;
  }

  displayBookingStatus(status: string): string {
    const normalized = (status || '').toString().trim().toLowerCase();
    if (normalized === 'confirmed' || normalized === 'approved')
      return 'Ongoing';
    if (normalized === 'completed' || normalized === 'done') return 'Completed';
    if (normalized === 'rejected') return 'Declined';
    if (normalized === 'cancelled' || normalized === 'canceled')
      return 'Cancelled';
    if (normalized === 'expired') return 'Expired';
    return normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : 'Pending';
  }

  normalizeBookingStatus(status: string): string {
    const normalized = (status || '').toString().trim().toLowerCase();
    if (normalized === 'confirmed') return 'approved';
    if (normalized === 'done') return 'completed';
    if (normalized === 'canceled') return 'cancelled';
    return normalized || 'pending';
  }

  navigateToHistory(): void {
    this.router.navigate(['/customer-view/tranaction-hitory']);
  }

  selectVehicle(vehicleId: number): void {
    this.selectedVehicleId =
      this.selectedVehicleId === vehicleId ? null : vehicleId;
  }

  isVehicleSelected(vehicleId: number): boolean {
    return this.selectedVehicleId === vehicleId;
  }

  navigateToAddVehicle(): void {
    this.router.navigate(['/customer-view/profile'], {
      queryParams: { addVehicle: 'true' },
    });
  }

  openServicesModal(): void {
    this.showServicesModal = true;
  }

  closeServicesModal(): void {
    this.showServicesModal = false;
  }

  navigateToEditProfile(): void {
    this.router.navigate(['/customer-view/profile'], {
      queryParams: { editProfile: 'true' },
    });
  }

  scrollToPricing(): void {
    const pricingSection = document.querySelector('.services-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToAppointmentWithPackage(
    vehicleType: string,
    servicePackage: string,
  ): void {
    this.router.navigate(['/customer-view/appointment'], {
      queryParams: {
        vehicle_type: vehicleType,
        service_package: servicePackage,
        price: this.pricingMatrix[vehicleType]?.[servicePackage] || 0,
      },
    });
  }

  // Handle authentication errors by redirecting to login
  redirectToLogin(): void {
    localStorage.removeItem('customer_data');
    localStorage.removeItem('auth_token');
    this.router.navigate(['/customer']);
  }

  // Check if customer is properly authenticated
  isAuthenticated(): boolean {
    return !!(
      this.customerId &&
      this.customerName &&
      this.customerName !== 'Customer'
    );
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined) {
      return 'Price not set';
    }

    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return 'Price not set';
    }

    return `₱${numericPrice.toFixed(2)}`;
  }

  getServicePackageDescription(code: string): string {
    return (
      this.servicePackages.find((pkg) => pkg.code === code)?.description || code
    );
  }

  getVehicleTypeDescription(code: string): string {
    return (
      this.vehicleTypes.find((vehicle) => vehicle.code === code)?.description ||
      code
    );
  }

  isPriceAvailable(vehicleType: string, servicePackage: string): boolean {
    const price = this.pricingMatrix[vehicleType]?.[servicePackage];
    if (price === null || price === undefined) {
      return false;
    }

    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    return !isNaN(numericPrice) && numericPrice > 0;
  }
}
