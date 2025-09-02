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

  // Vehicle types with descriptions
  vehicleTypes = [
    { code: 'S', description: 'Small Hatchbacks (wigo, picanto, eon)' },
    {
      code: 'M',
      description:
        'Small Hatchbacks | Sedan | Coupes (rio, accent, city, vios, civic)',
    },
    {
      code: 'L',
      description: 'MPVs | AUVs | Compact SUVs (rav4, avanza, ecosport, cx3)',
    },
    {
      code: 'XL',
      description:
        'SUVs | Full SUVs | Pick-ups (trailblazer, hilux, ranger, fortuner)',
    },
    {
      code: 'XXL',
      description: 'Modified Vehicles | Big SUVs (land cruiser, patrol, prado)',
    },
  ];

  // Service packages with descriptions
  servicePackages = [
    { code: '1', description: 'Body Wash' },
    { code: '1.5', description: 'Body Wash, Tire Black' },
    { code: '2', description: 'Body Wash, Tire Black, Vacuum' },
    { code: '3', description: 'Body Wash, Body Wax, Tire Black' },
    { code: '4', description: 'Body Wash, Body Wax, Tire Black, Vacuum' },
  ];

  // Empty pricing matrix (will be populated from database)
  defaultPricingMatrix: PricingMatrix = {};

  pricingMatrix: PricingMatrix = {};
  pricingEntries: PricingEntry[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCustomerData();
      this.loadPricingData();
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
    this.router.navigate(['/customer-view/appointment']);
  }

  navigateToAppointmentWithPackage(
    vehicleType: string,
    servicePackage: string
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

  // Logout method for customers
  logout(): void {
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

  // Refresh customer data and reload everything
  refreshCustomerData(): void {
    this.loadCustomerData();
    if (this.isAuthenticated()) {
      this.loadPricingData();
    }
  }

  formatPrice(price: number): string {
    if (price === null || price === undefined || price <= 0) {
      return 'Price not set';
    }
    return `₱${price.toFixed(2)}`;
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
    return typeof price === 'number' && price > 0;
  }
}
