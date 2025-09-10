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
  public isLoading = false;

  // Vehicle Types from the image
  vehicleTypes: VehicleType[] = [
    {
      code: 'S',
      description: 'SEDANS (all sedan types)',
      isActive: true,
    },
    {
      code: 'M',
      description: 'SUVs (all SUV types)',
      isActive: true,
    },
    {
      code: 'L',
      description: 'VANs (any type of van)',
      isActive: true,
    },
    {
      code: 'XL',
      description: 'Larger than vans (big SUVs/pickups, oversized vehicles)',
      isActive: true,
    },
  ];

  // Service Packages from the image
  servicePackages: ServicePackage[] = [
    { code: 'p1', description: 'Wash only', isActive: true },
    { code: 'p2', description: 'Wash / Vacuum', isActive: true },
    { code: 'p3', description: 'Wash / Vacuum / Hand Wax', isActive: true },
    { code: 'p4', description: 'Wash / Vacuum / Buffing Wax', isActive: true },
  ];

  // Dynamic pricing matrix built from database data
  get pricingMatrix(): { [key: string]: { [key: string]: number } } {
    const matrix: { [key: string]: { [key: string]: number } } = {};

    // Initialize matrix with default values
    this.vehicleTypes.forEach((vehicle) => {
      matrix[vehicle.code] = {};
      this.servicePackages.forEach((service) => {
        matrix[vehicle.code][service.code] = 0;
      });
    });

    // Populate matrix with actual database values
    this.pricingEntries.forEach((entry) => {
      if (
        entry.isActive &&
        matrix[entry.vehicleType] &&
        matrix[entry.vehicleType][entry.servicePackage] !== undefined
      ) {
        matrix[entry.vehicleType][entry.servicePackage] = entry.price;
      }
    });

    return matrix;
  }

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
  searchTerm = '';
  filteredPricingEntries: PricingEntry[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPricingEntries();
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.filterPricingEntries();
  }

  filterPricingEntries(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPricingEntries = [...this.pricingEntries].sort((a, b) => {
        // Sort by ID number in ascending order
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idA - idB;
      });
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredPricingEntries = this.pricingEntries
        .filter((entry) => {
          const vehicleDesc = this.getVehicleTypeDescription(
            entry.vehicleType
          ).toLowerCase();
          const serviceDesc = this.getServicePackageDescription(
            entry.servicePackage
          ).toLowerCase();
          const price = entry.price.toString();

          return (
            vehicleDesc.includes(search) ||
            serviceDesc.includes(search) ||
            price.includes(search) ||
            entry.vehicleType.toLowerCase().includes(search) ||
            entry.servicePackage.toLowerCase().includes(search)
          );
        })
        .sort((a, b) => {
          // Sort filtered results by ID number in ascending order
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idA - idB;
        });
    }
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
                  this.filterPricingEntries(); // Apply initial filter after loading
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
          price: 0, // Default price, will be populated from database
          isActive: true,
        });
      });
    });
    this.filterPricingEntries(); // Apply initial filter after creating default entries
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
                    this.filterPricingEntries(); // Re-filter after adding
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
    console.log('Editing entry:', entry);

    // If the entry doesn't have an ID, try to find the existing entry
    if (!entry.id) {
      const existingEntry = this.pricingEntries.find(
        (e) =>
          e.vehicleType === entry.vehicleType &&
          e.servicePackage === entry.servicePackage
      );
      if (existingEntry) {
        console.log('Found existing entry:', existingEntry);
        this.editMode = true;
        this.newPricingEntry = { ...existingEntry };
      } else {
        console.log('No existing entry found, creating new one');
        // If no existing entry found, this will be treated as a new entry
        this.editMode = false;
        this.newPricingEntry = { ...entry };
      }
    } else {
      this.editMode = true;
      this.newPricingEntry = { ...entry };
    }

    console.log('newPricingEntry after edit:', this.newPricingEntry);
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

          // If we don't have an ID, this should be treated as a new entry
          if (!this.newPricingEntry.id) {
            console.log('No ID found, treating as new entry');
            this.addPricingEntry();
            return;
          }

          const pricingData = {
            id: this.newPricingEntry.id,
            vehicle_type: this.newPricingEntry.vehicleType,
            service_package: this.newPricingEntry.servicePackage,
            price: this.newPricingEntry.price,
            is_active: this.newPricingEntry.isActive ? 1 : 0,
          };

          // Debug logging
          console.log('Sending pricing data:', pricingData);
          console.log('newPricingEntry:', this.newPricingEntry);

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
                console.log('Update response:', response);
                this.isLoading = false;
                if (response.status && response.status.remarks === 'success') {
                  this.showAlert(
                    'Pricing entry updated successfully!',
                    'success'
                  );
                  this.resetForm();
                  this.editMode = false;
                  this.loadPricingEntries();
                  this.filterPricingEntries(); // Re-filter after updating
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
                console.error('Error details:', {
                  status: error.status,
                  statusText: error.statusText,
                  error: error.error,
                  message: error.message,
                });
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
          .post<ApiResponse>(
            `${this.apiUrl}/delete_pricing_entry`,
            { id: this.deleteId },
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
                this.filterPricingEntries(); // Re-filter after deleting
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
          .put<ApiResponse>(
            `${this.apiUrl}/toggle_pricing_status`,
            pricingData,
            { headers }
          )
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                entry.isActive = updatedStatus;
                const status = entry.isActive ? 'activated' : 'deactivated';
                this.showAlert(`Pricing entry ${status} successfully!`, 'info');
                this.filterPricingEntries(); // Re-filter after status change
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
