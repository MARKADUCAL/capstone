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
  id: number;
  customer_id: number;
  nickname: string | null;
  vehicle_type: string;
  vehicle_model: string;
  plate_number: string;
  vehicle_color: string | null;
  created_at: string;
}

type VehicleForm = {
  nickname?: string;
  vehicleType: string;
  vehicleModel: string;
  plateNumber: string;
  vehicleColor?: string;
};

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

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.vehicleErrorMessage = 'Not authorized';
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    const vehicleData = {
      customer_id: this.profile.id,
      nickname: this.newVehicle.nickname?.trim() || null,
      vehicle_type: this.newVehicle.vehicleType,
      vehicle_model: this.newVehicle.vehicleModel.trim(),
      plate_number: this.newVehicle.plateNumber.trim().toUpperCase(),
      vehicle_color: this.newVehicle.vehicleColor?.trim() || null,
    };

    this.http
      .post(`${this.apiUrl}/add_customer_vehicle`, vehicleData, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status && response.status.remarks === 'success') {
            this.vehicleSuccessMessage = 'Vehicle added successfully.';
            this.isAddingVehicle = false;
            this.resetVehicleForm();
            // Reload vehicles from database
            this.loadVehiclesForCurrentProfile();
          } else {
            this.vehicleErrorMessage =
              response.status?.message || 'Failed to add vehicle';
          }
        },
        error: (error) => {
          this.vehicleErrorMessage =
            error.error?.status?.message ||
            'An error occurred while adding vehicle';
          console.error('Vehicle add error:', error);
        },
      });
  }

  removeVehicle(vehicleId: number): void {
    this.vehicleSuccessMessage = '';
    this.vehicleErrorMessage = '';

    if (!this.isBrowser) {
      this.vehicleErrorMessage =
        'Vehicle management is only available in the browser.';
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.vehicleErrorMessage = 'Not authorized';
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${this.apiUrl}/customer_vehicles/${vehicleId}`, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status && response.status.remarks === 'success') {
            this.vehicleSuccessMessage = 'Vehicle removed.';
            // Reload vehicles from database
            this.loadVehiclesForCurrentProfile();
          } else {
            this.vehicleErrorMessage =
              response.status?.message || 'Failed to remove vehicle';
          }
        },
        error: (error) => {
          this.vehicleErrorMessage =
            error.error?.status?.message ||
            'An error occurred while removing vehicle';
          console.error('Vehicle remove error:', error);
        },
      });
  }

  private loadVehiclesForCurrentProfile(): void {
    if (!this.isBrowser) return;

    if (!this.profile.id) {
      this.customerVehicles = [];
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, cannot load vehicles');
      this.customerVehicles = [];
      return;
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    this.http
      .get<any>(
        `${this.apiUrl}/get_customer_vehicles?customer_id=${this.profile.id}`,
        { headers }
      )
      .subscribe({
        next: (response: any) => {
          if (response.status && response.status.remarks === 'success') {
            this.customerVehicles = response.payload?.vehicles || [];
          } else {
            console.error('Failed to load vehicles:', response.status?.message);
            this.customerVehicles = [];
          }
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.customerVehicles = [];
        },
      });
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
}
