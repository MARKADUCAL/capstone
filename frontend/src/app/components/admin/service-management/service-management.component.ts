import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface PricingEntry {
  id?: number;
  vehicleType: string;
  servicePackage: string;
  price: number;
  isActive: boolean;
}

interface VehicleType {
  code: string;
  description: string;
  isActive: boolean;
}

interface ServicePackage {
  code: string;
  description: string;
  isActive: boolean;
}

interface ApiResponse {
  status: {
    remarks: string;
    message: string;
  };
  payload?: any;
}

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-management.component.html',
  styleUrl: './service-management.component.css',
})
export class ServiceManagementComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = environment.apiUrl;
  private isLoading = false;

  // Vehicle Types from the image
  vehicleTypes: VehicleType[] = [
    {
      code: 'S',
      description: 'SMALL HATCHBACKS [wigo, picanto, eon, etc.]',
      isActive: true,
    },
    {
      code: 'M',
      description:
        'SMALL HATCHBACKS | SEDAN | COUPES [rio, accent, city, vios, civic, etc.]',
      isActive: true,
    },
    {
      code: 'L',
      description:
        'MPVs | AUVs | COMPACT SUVs [rav4, avanza, ecosport, cx3, etc.]',
      isActive: true,
    },
    {
      code: 'XL',
      description:
        'SUVs | FULL SUVs | PICK-UPS [trailblazer, hilux, ranger, fortuner, etc.]',
      isActive: true,
    },
    {
      code: 'XXL',
      description:
        'MODIFIED VEHICLES | BIG SUVs [land cruiser, patrol, prado, etc.]',
      isActive: true,
    },
  ];

  // Service Packages from the image
  servicePackages: ServicePackage[] = [
    { code: '1', description: 'BODY WASH', isActive: true },
    { code: '1.5', description: 'BODY WASH, TIRE BLACK', isActive: true },
    { code: '2', description: 'BODY WASH, TIRE BLACK, VACUUM', isActive: true },
    {
      code: '3',
      description: 'BODY WASH, BODY WAX, TIRE BLACK',
      isActive: true,
    },
    {
      code: '4',
      description: 'BODY WASH, BODY WAX, TIRE BLACK, VACUUM',
      isActive: true,
    },
  ];

  // Pricing table based on the image
  pricingTable: { [key: string]: { [key: string]: number } } = {
    S: {
      '1': 140,
      '1.5': 170,
      '2': 260,
      '3': 270,
      '4': 360,
    },
    M: {
      '1': 160,
      '1.5': 190,
      '2': 300,
      '3': 310,
      '4': 420,
    },
    L: {
      '1': 180,
      '1.5': 230,
      '2': 370,
      '3': 390,
      '4': 520,
    },
    XL: {
      '1': 230,
      '1.5': 290,
      '2': 440,
      '3': 460,
      '4': 610,
    },
    XXL: {
      '1': 250,
      '1.5': 320,
      '2': 480,
      '3': 510,
      '4': 670,
    },
  };

  pricingEntries: PricingEntry[] = [];
  newPricingEntry: PricingEntry = {
    vehicleType: '',
    servicePackage: '',
    price: 0,
    isActive: true,
  };

  editMode = false;
  currentId = 0;
  showModal = false;
  modalMessage = '';
  modalType = '';
  deleteId = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPricingEntries();
  }

  loadPricingEntries(): void {
    this.isLoading = true;

    if (this.isBrowser) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${token}`
        );

        this.http
          .get<ApiResponse>(`${this.apiUrl}/get_all_pricing`, { headers })
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                if (
                  response.payload &&
                  Array.isArray(response.payload.pricing)
                ) {
                  this.pricingEntries = response.payload.pricing.map(
                    (p: any) => ({
                      id: p.id,
                      vehicleType: p.vehicle_type,
                      servicePackage: p.service_package,
                      price: parseFloat(p.price),
                      isActive: p.is_active === 1 || p.is_active === true,
                    })
                  );
                } else {
                  // If no pricing data exists, create default entries
                  this.createDefaultPricingEntries();
                }
              } else {
                this.showAlert(
                  response.status?.message || 'Failed to load pricing',
                  'error'
                );
              }
            },
            error: (error) => {
              console.error('Error loading pricing:', error);
              this.isLoading = false;
              // Create default entries if API fails
              this.createDefaultPricingEntries();
            },
          });
      } else {
        this.isLoading = false;
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      this.isLoading = false;
    }
  }

  createDefaultPricingEntries(): void {
    this.pricingEntries = [];
    this.vehicleTypes.forEach((vehicle) => {
      this.servicePackages.forEach((service) => {
        this.pricingEntries.push({
          vehicleType: vehicle.code,
          servicePackage: service.code,
          price: this.pricingTable[vehicle.code][service.code] || 0,
          isActive: true,
        });
      });
    });
  }

  addPricingEntry(): void {
    if (this.validatePricingEntry()) {
      this.isLoading = true;

      if (this.isBrowser) {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`);

          const pricingData = {
            vehicle_type: this.newPricingEntry.vehicleType,
            service_package: this.newPricingEntry.servicePackage,
            price: this.newPricingEntry.price,
            is_active: this.newPricingEntry.isActive ? 1 : 0,
          };

          this.http
            .post<ApiResponse>(
              `${this.apiUrl}/add_pricing_entry`,
              pricingData,
              {
                headers,
              }
            )
            .subscribe({
              next: (response) => {
                this.isLoading = false;
                if (response.status && response.status.remarks === 'success') {
                  if (response.payload && response.payload.pricing) {
                    const createdEntry = response.payload.pricing;
                    const newEntry: PricingEntry = {
                      id: createdEntry.id,
                      vehicleType: createdEntry.vehicle_type,
                      servicePackage: createdEntry.service_package,
                      price: parseFloat(createdEntry.price),
                      isActive:
                        createdEntry.is_active === 1 ||
                        createdEntry.is_active === true,
                    };

                    this.pricingEntries.push(newEntry);
                  }

                  this.resetForm();
                  this.showAlert(
                    'Pricing entry added successfully!',
                    'success'
                  );
                  this.loadPricingEntries();
                } else {
                  this.showAlert(
                    response.status?.message || 'Failed to add pricing entry',
                    'error'
                  );
                }
              },
              error: (error) => {
                this.isLoading = false;
                console.error('Error adding pricing entry:', error);
                this.showAlert(
                  'Error adding pricing entry to database. Please try again.',
                  'error'
                );
              },
            });
        } else {
          this.isLoading = false;
          this.showAlert('Authentication token not found', 'warning');
        }
      } else {
        this.isLoading = false;
        this.showAlert(
          'Cannot add pricing entries in server environment',
          'error'
        );
      }
    }
  }

  editPricingEntry(entry: PricingEntry): void {
    this.editMode = true;
    this.newPricingEntry = { ...entry };
  }

  updatePricingEntry(): void {
    if (this.validatePricingEntry()) {
      this.isLoading = true;

      if (this.isBrowser) {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`);

          const pricingData = {
            id: this.newPricingEntry.id,
            vehicle_type: this.newPricingEntry.vehicleType,
            service_package: this.newPricingEntry.servicePackage,
            price: this.newPricingEntry.price,
            is_active: this.newPricingEntry.isActive ? 1 : 0,
          };

          this.http
            .put<ApiResponse>(
              `${this.apiUrl}/update_pricing_entry`,
              pricingData,
              {
                headers,
              }
            )
            .subscribe({
              next: (response) => {
                this.isLoading = false;
                if (response.status && response.status.remarks === 'success') {
                  this.showAlert(
                    'Pricing entry updated successfully!',
                    'success'
                  );
                  this.resetForm();
                  this.editMode = false;
                  this.loadPricingEntries();
                } else {
                  this.showAlert(
                    response.status?.message ||
                      'Failed to update pricing entry',
                    'error'
                  );
                }
              },
              error: (error) => {
                console.error('Error updating pricing entry:', error);
                this.isLoading = false;
                this.showAlert('Failed to update pricing entry', 'error');
              },
            });
        } else {
          this.isLoading = false;
          this.showAlert('Authentication token not found', 'warning');
          this.resetForm();
          this.editMode = false;
        }
      } else {
        this.isLoading = false;
        this.showAlert(
          'Cannot update pricing entries in server environment',
          'error'
        );
        this.resetForm();
        this.editMode = false;
      }
    }
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showModal = true;
    this.modalMessage = 'Are you sure you want to delete this pricing entry?';
    this.modalType = 'delete';
  }

  deletePricingEntry(): void {
    if (!this.deleteId || this.deleteId === 0) {
      this.showAlert('Invalid pricing entry ID for deletion.', 'error');
      return;
    }
    this.isLoading = true;

    if (this.isBrowser) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const headers = new HttpHeaders()
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${token}`);

        this.http
          .get<ApiResponse>(
            `${this.apiUrl}/delete_pricing_entry?id=${this.deleteId}`,
            {
              headers,
            }
          )
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                this.closeModal();
                this.showAlert(
                  'Pricing entry deleted successfully!',
                  'success'
                );
                this.loadPricingEntries();
              } else {
                this.showAlert(
                  response.status?.message || 'Failed to delete pricing entry',
                  'error'
                );
                this.closeModal();
              }
            },
            error: (error) => {
              console.error('Error deleting pricing entry:', error);
              this.isLoading = false;
              this.closeModal();
              this.showAlert('Failed to delete pricing entry', 'error');
            },
          });
      } else {
        this.isLoading = false;
        this.closeModal();
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      this.isLoading = false;
      this.closeModal();
      this.showAlert(
        'Cannot delete pricing entries in server environment',
        'error'
      );
    }
  }

  toggleStatus(entry: PricingEntry): void {
    if (this.isBrowser) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        this.isLoading = true;
        const headers = new HttpHeaders()
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${token}`);

        const updatedStatus = !entry.isActive;
        const pricingData = {
          id: entry.id,
          vehicle_type: entry.vehicleType,
          service_package: entry.servicePackage,
          price: entry.price,
          is_active: updatedStatus ? 1 : 0,
        };

        this.http
          .put<ApiResponse>(`${this.apiUrl}/pricing`, pricingData, { headers })
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                entry.isActive = updatedStatus;
                const status = entry.isActive ? 'activated' : 'deactivated';
                this.showAlert(`Pricing entry ${status} successfully!`, 'info');
              } else {
                this.showAlert(
                  response.status?.message ||
                    'Failed to update pricing entry status',
                  'error'
                );
              }
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error updating pricing entry status:', error);
              this.showAlert('Failed to update pricing entry status', 'error');
            },
          });
      } else {
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      this.showAlert(
        'Cannot update pricing entry status in server environment',
        'error'
      );
    }
  }

  resetForm(): void {
    this.newPricingEntry = {
      vehicleType: '',
      servicePackage: '',
      price: 0,
      isActive: true,
    };
  }

  cancelEdit(): void {
    this.editMode = false;
    this.resetForm();
  }

  validatePricingEntry(): boolean {
    if (
      !this.newPricingEntry.vehicleType ||
      !this.newPricingEntry.servicePackage ||
      this.newPricingEntry.price <= 0
    ) {
      this.showAlert(
        'Please fill all required fields with valid values.',
        'error'
      );
      return false;
    }
    return true;
  }

  getVehicleTypeDescription(code: string): string {
    const vehicle = this.vehicleTypes.find((v) => v.code === code);
    return vehicle ? vehicle.description : code;
  }

  getServicePackageDescription(code: string): string {
    const service = this.servicePackages.find((s) => s.code === code);
    return service ? service.description : code;
  }

  showAlert(message: string, type: string): void {
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;

    // Auto close success and info alerts after 2 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.closeModal();
      }, 2000);
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
    this.modalType = '';
    this.deleteId = 0;
  }
}
