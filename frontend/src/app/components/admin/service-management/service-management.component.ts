import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
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
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './service-management.component.html',
  styleUrl: './service-management.component.css',
})
export class ServiceManagementComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = environment.apiUrl;
  private isLoading = false;

  services: Service[] = [];
  categories: string[] = [
    'Basic Wash',
    'Premium Wash',
    'Detailing',
    'Additional Services',
  ];

  newService: Service = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    duration: 0,
    category: '',
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
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;

    if (this.isBrowser) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const headers = new HttpHeaders().set(
          'Authorization',
          `Bearer ${token}`
        );

        this.http
          .get<ApiResponse>(`${this.apiUrl}/services`, { headers })
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                if (
                  response.payload &&
                  Array.isArray(response.payload.services)
                ) {
                  // Map the database services to our Service interface
                  this.services = response.payload.services.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description || '',
                    price: parseFloat(s.price),
                    duration: s.duration_minutes,
                    category: s.category || 'Basic Wash', // Default category if not in DB
                    isActive: s.is_active === 1 || s.is_active === true,
                  }));

                  // Update currentId
                  if (this.services.length > 0) {
                    this.currentId = Math.max(
                      ...this.services.map((s) => s.id),
                      0
                    );
                  }
                } else {
                  this.showAlert(
                    'No services found or invalid data format',
                    'warning'
                  );
                }
              } else {
                this.showAlert(
                  response.status?.message || 'Failed to load services',
                  'error'
                );
              }
            },
            error: (error) => {
              console.error('Error loading services:', error);
              this.isLoading = false;
              this.showAlert('Error loading services from the server', 'error');
            },
          });
      } else {
        this.isLoading = false;
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      // In server environment (SSR), we can't make HTTP requests
      this.isLoading = false;
    }
  }

  addService(): void {
    if (this.validateService()) {
      this.isLoading = true;

      if (this.isBrowser) {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`);

          // Prepare data for API
          const serviceData = {
            name: this.newService.name,
            description: this.newService.description,
            price: this.newService.price,
            duration_minutes: this.newService.duration,
            category: this.newService.category,
            is_active: this.newService.isActive ? 1 : 0,
          };

          this.http
            .post<ApiResponse>(`${this.apiUrl}/services`, serviceData, {
              headers,
            })
            .subscribe({
              next: (response) => {
                this.isLoading = false;
                if (response.status && response.status.remarks === 'success') {
                  // If API returns the created service with ID
                  if (response.payload && response.payload.service) {
                    const createdService = response.payload.service;

                    // Map to our Service interface
                    const newService: Service = {
                      id: createdService.id,
                      name: createdService.name,
                      description: createdService.description || '',
                      price: parseFloat(createdService.price),
                      duration: createdService.duration_minutes,
                      category: createdService.category || 'Basic Wash',
                      isActive:
                        createdService.is_active === 1 ||
                        createdService.is_active === true,
                    };

                    this.services.push(newService);
                    if (newService.id > this.currentId) {
                      this.currentId = newService.id;
                    }
                  }

                  this.resetForm();
                  this.showAlert('Service added successfully!', 'success');
                  this.loadServices(); // Refresh the list
                } else {
                  this.showAlert(
                    response.status?.message || 'Failed to add service',
                    'error'
                  );
                }
              },
              error: (error) => {
                this.isLoading = false;
                console.error('Error adding service:', error);
                this.showAlert(
                  'Error adding service to database. Please try again.',
                  'error'
                );
              },
            });
        } else {
          // No token
          this.isLoading = false;
          this.showAlert('Authentication token not found', 'warning');
        }
      } else {
        // In server environment (shouldn't normally reach here)
        this.isLoading = false;
        this.showAlert('Cannot add services in server environment', 'error');
      }
    }
  }

  editService(service: Service): void {
    this.editMode = true;
    this.newService = { ...service };
  }

  updateService(): void {
    if (this.validateService()) {
      this.isLoading = true;

      if (this.isBrowser) {
        const token = localStorage.getItem('admin_token');
        if (token) {
          const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`);

          // Prepare data for API
          const serviceData = {
            id: this.newService.id,
            name: this.newService.name,
            description: this.newService.description,
            price: this.newService.price,
            duration_minutes: this.newService.duration,
            category: this.newService.category,
            is_active: this.newService.isActive ? 1 : 0,
          };

          this.http
            .put<ApiResponse>(`${this.apiUrl}/services`, serviceData, {
              headers,
            })
            .subscribe({
              next: (response) => {
                this.isLoading = false;
                if (response.status && response.status.remarks === 'success') {
                  this.showAlert('Service updated successfully!', 'success');
                  this.resetForm();
                  this.editMode = false;
                  this.loadServices(); // Refresh the list
                } else {
                  this.showAlert(
                    response.status?.message || 'Failed to update service',
                    'error'
                  );
                }
              },
              error: (error) => {
                console.error('Error updating service:', error);
                this.isLoading = false;
                this.showAlert('Failed to update service', 'error');
              },
            });
        } else {
          // No token
          this.isLoading = false;
          this.showAlert('Authentication token not found', 'warning');
          this.resetForm();
          this.editMode = false;
        }
      } else {
        // Server environment
        this.isLoading = false;
        this.showAlert('Cannot update services in server environment', 'error');
        this.resetForm();
        this.editMode = false;
      }
    }
  }

  confirmDelete(id: number): void {
    console.log('confirmDelete called with id:', id);
    this.deleteId = id;
    this.showModal = true;
    this.modalMessage = 'Are you sure you want to delete this service?';
    this.modalType = 'delete';
  }

  deleteService(): void {
    console.log('Attempting to delete service with ID:', this.deleteId);
    if (!this.deleteId || this.deleteId === 0) {
      this.showAlert('Invalid service ID for deletion.', 'error');
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
          .delete<ApiResponse>(`${this.apiUrl}/services/${this.deleteId}`, {
            headers,
          })
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                this.closeModal();
                this.showAlert('Service deleted successfully!', 'success');
                this.loadServices(); // Refresh the list
              } else {
                this.showAlert(
                  response.status?.message || 'Failed to delete service',
                  'error'
                );
                this.closeModal();
              }
            },
            error: (error) => {
              console.error('Error deleting service:', error);
              this.isLoading = false;
              this.closeModal();
              this.showAlert('Failed to delete service', 'error');
            },
          });
      } else {
        // No token
        this.isLoading = false;
        this.closeModal();
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      // Server environment
      this.isLoading = false;
      this.closeModal();
      this.showAlert('Cannot delete services in server environment', 'error');
    }
  }

  toggleStatus(service: Service): void {
    if (this.isBrowser) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        this.isLoading = true;
        const headers = new HttpHeaders()
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${token}`);

        // Toggle status in API
        const updatedStatus = !service.isActive;
        const serviceData = {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration_minutes: service.duration,
          category: service.category,
          is_active: updatedStatus ? 1 : 0,
        };

        this.http
          .put<ApiResponse>(`${this.apiUrl}/services`, serviceData, { headers })
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.status && response.status.remarks === 'success') {
                service.isActive = updatedStatus;
                const status = service.isActive ? 'activated' : 'deactivated';
                this.showAlert(`Service ${status} successfully!`, 'info');
              } else {
                this.showAlert(
                  response.status?.message || 'Failed to update service status',
                  'error'
                );
              }
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error updating service status:', error);
              this.showAlert('Failed to update service status', 'error');
            },
          });
      } else {
        // No token
        this.showAlert('Authentication token not found', 'warning');
      }
    } else {
      // In server environment
      this.showAlert(
        'Cannot update service status in server environment',
        'error'
      );
    }
  }

  resetForm(): void {
    this.newService = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      duration: 0,
      category: '',
      isActive: true,
    };
  }

  cancelEdit(): void {
    this.editMode = false;
    this.resetForm();
  }

  validateService(): boolean {
    if (
      !this.newService.name ||
      !this.newService.description ||
      !this.newService.category ||
      this.newService.price <= 0 ||
      this.newService.duration <= 0
    ) {
      this.showAlert(
        'Please fill all required fields with valid values.',
        'error'
      );
      return false;
    }
    return true;
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
