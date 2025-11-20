import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { VEHICLE_TYPES } from '../../../models/booking.model';

interface CustomerProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface CustomerVehicle {
  id: string;
  nickname: string;
  vehicleType: string;
  vehicleModel: string;
  plateNumber: string;
  vehicleColor?: string;
  createdAt: string;
}

type VehicleForm = Omit<CustomerVehicle, 'id' | 'createdAt'>;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  profile: CustomerProfile = {
    id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  };

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isEditing: boolean = false;
  isSaving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  vehicleSuccessMessage: string = '';
  vehicleErrorMessage: string = '';

  vehicleTypes = VEHICLE_TYPES;
  customerVehicles: CustomerVehicle[] = [];
  isAddingVehicle: boolean = false;
  newVehicle: VehicleForm = {
    nickname: '',
    vehicleType: '',
    vehicleModel: '',
    plateNumber: '',
    vehicleColor: '',
  };

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadProfile();
    this.checkUserType();
  }

  checkUserType(): void {
    if (!this.isBrowser) return;

    // Get the current route
    const currentUrl = this.router.url;

    // Check if we're in a customer view but the page is showing employee profile
    if (
      currentUrl.includes('customer-view') &&
      !localStorage.getItem('customer_data')
    ) {
      // Redirect to login or display error
      this.errorMessage = 'You are not authorized to view this page.';
      setTimeout(() => {
        this.router.navigate(['/customer']);
      }, 2000);
    }
  }

  loadProfile(): void {
    if (!this.isBrowser) return;

    const customerData = localStorage.getItem('customer_data');
    if (customerData) {
      this.profile = { ...this.profile, ...JSON.parse(customerData) };
      this.loadVehiclesForCurrentProfile();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Password validation if changing password
    if (this.newPassword) {
      if (!this.currentPassword) {
        this.errorMessage = 'Current password is required to change password';
        this.isSaving = false;
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'New password and confirm password do not match';
        this.isSaving = false;
        return;
      }

      if (this.newPassword.length < 6) {
        this.errorMessage = 'Password must be at least 6 characters long';
        this.isSaving = false;
        return;
      }
    }

    if (!this.isBrowser) {
      this.errorMessage =
        'Profile update is only available in browser environment';
      this.isSaving = false;
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.errorMessage = 'Not authorized';
      this.isSaving = false;
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    const updateData = {
      id: this.profile.id,
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      email: this.profile.email,
      phone: this.profile.phone,
      current_password: this.currentPassword,
      new_password: this.newPassword || null,
    };

    this.http
      .put(`${this.apiUrl}/update_customer_profile`, updateData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isSaving = false;
          if (response.status && response.status.remarks === 'success') {
            this.successMessage = 'Profile updated successfully';

            // Update localStorage
            if (response.payload && response.payload.customer) {
              localStorage.setItem(
                'customer_data',
                JSON.stringify(response.payload.customer)
              );
            } else {
              // If backend doesn't return updated data, update with current form data
              localStorage.setItem(
                'customer_data',
                JSON.stringify(this.profile)
              );
            }

            // Reset password fields
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';

            this.isEditing = false;
          } else {
            this.errorMessage =
              response.status?.message || 'Failed to update profile';
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.errorMessage =
            error.error?.status?.message ||
            'An error occurred while updating profile';
          console.error('Profile update error:', error);
        },
      });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadProfile(); // Reload original data
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  startAddVehicle(): void {
    this.isAddingVehicle = true;
    this.vehicleErrorMessage = '';
    this.vehicleSuccessMessage = '';
  }

  cancelAddVehicle(): void {
    this.isAddingVehicle = false;
    this.vehicleErrorMessage = '';
    this.resetVehicleForm();
  }

  addVehicle(): void {
    this.vehicleSuccessMessage = '';
    this.vehicleErrorMessage = '';

    if (!this.isBrowser) {
      this.vehicleErrorMessage =
        'Vehicle management is only available in the browser.';
      return;
    }

    if (!this.profile.id) {
      this.vehicleErrorMessage = 'Please reload your profile before adding a vehicle.';
      return;
    }

    const requiredFields: Array<keyof VehicleForm> = [
      'vehicleType',
      'vehicleModel',
      'plateNumber',
    ];

    const missingField = requiredFields.find((field) => {
      const value = this.newVehicle[field];
      return !value || value.toString().trim().length === 0;
    });

    if (missingField) {
      this.vehicleErrorMessage = 'Vehicle type, model, and plate number are required.';
      return;
    }

    const vehicle: CustomerVehicle = {
      id: this.generateVehicleId(),
      nickname: this.newVehicle.nickname?.trim() || '',
      vehicleType: this.newVehicle.vehicleType,
      vehicleModel: this.newVehicle.vehicleModel.trim(),
      plateNumber: this.newVehicle.plateNumber.trim().toUpperCase(),
      vehicleColor: this.newVehicle.vehicleColor?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const previousVehicles = [...this.customerVehicles];
    this.customerVehicles = [...this.customerVehicles, vehicle];

    if (this.persistVehicles()) {
      this.vehicleSuccessMessage = 'Vehicle added successfully.';
      this.isAddingVehicle = false;
      this.resetVehicleForm();
    } else {
      this.customerVehicles = previousVehicles;
    }
  }

  removeVehicle(vehicleId: string): void {
    this.vehicleSuccessMessage = '';
    this.vehicleErrorMessage = '';

    const previousVehicles = [...this.customerVehicles];
    this.customerVehicles = this.customerVehicles.filter(
      (vehicle) => vehicle.id !== vehicleId
    );

    if (this.persistVehicles()) {
      this.vehicleSuccessMessage = 'Vehicle removed.';
    } else {
      this.customerVehicles = previousVehicles;
    }
  }

  private loadVehiclesForCurrentProfile(): void {
    if (!this.isBrowser) return;

    const key = this.getVehicleStorageKey();
    let storedVehicles = this.readVehiclesFromStorage(key);

    if ((!storedVehicles || storedVehicles.length === 0) && this.profile.id) {
      const guestVehicles = this.readVehiclesFromStorage('customer_vehicles_guest');
      if (guestVehicles.length > 0) {
        storedVehicles = guestVehicles;
        try {
          localStorage.setItem(key, JSON.stringify(guestVehicles));
          localStorage.removeItem('customer_vehicles_guest');
        } catch (error) {
          console.error('Failed to migrate vehicle storage:', error);
        }
      }
    }

    this.customerVehicles = storedVehicles;
  }

  private readVehiclesFromStorage(key: string): CustomerVehicle[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as CustomerVehicle[]) : [];
    } catch (error) {
      console.error('Failed to parse stored vehicles:', error);
      return [];
    }
  }

  private persistVehicles(): boolean {
    if (!this.isBrowser) {
      this.vehicleErrorMessage =
        'Vehicle management is only available in the browser.';
      return false;
    }

    try {
      localStorage.setItem(
        this.getVehicleStorageKey(),
        JSON.stringify(this.customerVehicles)
      );
      return true;
    } catch (error) {
      console.error('Failed to persist vehicles:', error);
      this.vehicleErrorMessage =
        'We could not save your vehicles locally. Please check your browser storage settings.';
      return false;
    }
  }

  private resetVehicleForm(): void {
    this.newVehicle = {
      nickname: '',
      vehicleType: '',
      vehicleModel: '',
      plateNumber: '',
      vehicleColor: '',
    };
  }

  private getVehicleStorageKey(): string {
    const id = this.profile?.id;
    return `customer_vehicles_${id && id > 0 ? id : 'guest'}`;
  }

  private generateVehicleId(): string {
    const cryptoRef = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined;
    if (cryptoRef?.randomUUID) {
      return cryptoRef.randomUUID();
    }
    return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
