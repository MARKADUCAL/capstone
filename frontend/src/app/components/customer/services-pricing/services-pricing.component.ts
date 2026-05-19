import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  templateUrl: './services-pricing.component.html',
  styleUrl: './services-pricing.component.css',
  standalone: true,
})
export class ServicesPricingComponent implements OnInit {
  customerName: string = 'Customer';
  customerId: string = '';
  loading: boolean = false;
  error: string = '';
  isBrowser: boolean;
  showServicesModal: boolean = false;
  userVehicles: any[] = [];
  loadingVehicles: boolean = false;
  selectedVehicleId: number | null = null;

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
    }
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
        console.error('Error parsing customer data:', error);
        this.error =
          'Failed to load customer information. Please log in again.';
      }
    } else {
      console.error('No customer data found in localStorage');
      this.error = 'Please log in to view pricing.';
    }
  }

  loadServicePackages(): void {
    this.http.get<any>(`${environment.apiUrl}/get_packages`).subscribe({
      next: (response) => {
        if (response.status && response.status.remarks === 'success') {
          this.servicePackages = response.payload.packages || [];
          console.log('Loaded service packages:', this.servicePackages);
        } else {
          console.error('Failed to load service packages:', response);
          this.servicePackages = [];
        }
      },
      error: (error) => {
        console.error('Error loading service packages:', error);
        this.servicePackages = [];
      },
    });
  }

  loadPricingData(): void {
    this.loading = true;
    this.error = '';

    // Load pricing from database
    this.http.get<any>(`${environment.apiUrl}/get_pricing_matrix`).subscribe({
      next: (response) => {
        if (response.status && response.status.remarks === 'success') {
          this.pricingMatrix = response.payload.pricing_matrix || {};
          console.log('Loaded pricing matrix:', this.pricingMatrix);
        } else {
          console.error('Failed to load pricing matrix:', response);
          this.pricingMatrix = {};
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pricing matrix:', error);
        this.pricingMatrix = {};
        this.loading = false;
      },
    });
  }

  navigateToAppointment(): void {
    // If a vehicle is selected, pass it to the appointment page
    if (this.selectedVehicleId) {
      this.router.navigate(['/customer-view/appointment'], {
        queryParams: {
          vehicle_id: this.selectedVehicleId,
        },
      });
    } else {
      // No vehicle selected, navigate normally
      this.router.navigate(['/customer-view/appointment']);
    }
  }

  loadUserVehicles(): void {
    if (!this.customerId) return;

    this.loadingVehicles = true;
    this.http
      .get<any>(
        `${environment.apiUrl}/get_customer_vehicles?customer_id=${this.customerId}`,
      )
      .subscribe({
        next: (response) => {
          if (response.status && response.status.remarks === 'success') {
            this.userVehicles = response.payload.vehicles || [];
            console.log('Loaded user vehicles:', this.userVehicles);
          }
          this.loadingVehicles = false;
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.userVehicles = [];
          this.loadingVehicles = false;
        },
      });
  }

  get hasVehicles(): boolean {
    return this.userVehicles && this.userVehicles.length > 0;
  }

  // Get first 2 vehicles for display
  get displayedVehicles(): any[] {
    return this.userVehicles.slice(0, 2);
  }

  // Get count of remaining vehicles
  get remainingVehiclesCount(): number {
    return Math.max(0, this.userVehicles.length - 2);
  }

  // Select/toggle a specific vehicle
  bookVehicle(vehicle: any): void {
    // Toggle selection - if already selected, deselect; otherwise select this one
    if (this.selectedVehicleId === vehicle.id) {
      this.selectedVehicleId = null;
    } else {
      this.selectedVehicleId = vehicle.id;
    }
  }

  // Check if a vehicle is selected
  isVehicleSelected(vehicle: any): boolean {
    return this.selectedVehicleId === vehicle.id;
  }

  // Navigate to appointment with selected vehicle
  proceedToBooking(): void {
    if (this.selectedVehicleId) {
      this.router.navigate(['/customer-view/appointment'], {
        queryParams: {
          vehicle_id: this.selectedVehicleId,
        },
      });
    } else {
      // No vehicle selected, just navigate to appointment
      this.router.navigate(['/customer-view/appointment']);
    }
  }

  openServicesModal(): void {
    this.showServicesModal = true;
  }

  closeServicesModal(): void {
    this.showServicesModal = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/customer-view/profile']);
  }

  navigateToAddVehicle(): void {
    // Navigate to profile with a query parameter to trigger the add vehicle modal
    this.router.navigate(['/customer-view/profile'], {
      queryParams: { action: 'add-vehicle' },
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
