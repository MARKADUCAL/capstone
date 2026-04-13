import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pricing-guide-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pricing-modal-content">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-branding">
          <h2>Pricing guide</h2>
        </div>
        <button
          mat-icon-button
          [mat-dialog-close]="true"
          aria-label="Close"
          class="close-btn"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Step 1: Vehicle Types -->
        <div class="pricing-step">
          <div class="step-header">
            <span class="step-number">1</span>
            <h4>Identify vehicle type</h4>
          </div>
          <div class="vehicle-types-buttons">
            <button
              class="vehicle-type-btn"
              [class.selected]="selectedVehicleType === type"
              *ngFor="let type of data.vehicleTypeCodes"
              (click)="selectVehicleType(type)"
              type="button"
            >
              <span class="vehicle-code">{{ type }}</span>
              <span class="vehicle-label">{{ getVehicleLabel(type) }}</span>
            </button>
          </div>
        </div>

        <!-- Step 2: Service Packages -->
        <div class="pricing-step">
          <div class="step-header">
            <span class="step-number">2</span>
            <h4>Select service package</h4>
          </div>
          <div class="service-packages-list">
            <div
              class="service-package-item"
              [class.selected]="selectedService === service"
              (click)="selectService(service)"
              *ngFor="let service of data.servicePackages; let i = index"
            >
              <div class="service-number-badge">{{ i + 1 }}</div>
              <div class="service-content">
                <span class="service-name">{{
                  data.extractServiceDescription(service)
                }}</span>
                <div class="service-tags">
                  <span class="tag" *ngFor="let tag of extractServiceTags(service)">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Your Price -->
        <div class="pricing-step price-section">
          <div class="step-header">
            <span class="step-number">3</span>
            <h4>Your price</h4>
          </div>
          <div class="price-display-card">
            <div class="price-label">Your estimated price</div>
            <div class="price-amount">
              {{ calculatePrice() }}
            </div>
            <div class="price-details" *ngIf="selectedVehicleType">
              Vehicle size: <strong>{{ selectedVehicleType }}</strong>
            </div>
            <div class="price-details" *ngIf="!selectedVehicleType">
              Select a vehicle type and service to see price
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button mat-raised-button color="accent" class="book-btn">
          <i class="fas fa-check"></i>
          Book this service
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep {
        --accent-color: #16a34a;
        --dark-bg: #1a1a1a;
        --card-bg: #2a2a2a;
        --text-light: #e0e0e0;
        --text-muted: #a0a0a0;
      }

      .pricing-modal-content {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: var(--dark-bg);
        color: var(--text-light);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: linear-gradient(135deg, var(--accent-color) 0%, #15803d 100%);
        color: white;
        margin: -24px -24px 0 -24px;
        border-radius: 4px 4px 0 0;
      }

      .header-branding h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .close-btn {
        color: white;
        opacity: 0.8;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: var(--dark-bg);
      }

      .pricing-step {
        margin-bottom: 28px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-light);
          text-transform: capitalize;
        }
      }

      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: var(--accent-color);
        color: white;
        border-radius: 50%;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      /* Vehicle Type Buttons */
      .vehicle-types-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .vehicle-type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 8px;
        background: transparent;
        border: 2px solid var(--text-muted);
        border-radius: 8px;
        color: var(--text-light);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;

        &:hover {
          border-color: var(--accent-color);
          background: rgba(22, 163, 74, 0.1);
        }

        &.selected {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }
      }

      .vehicle-code {
        font-size: 18px;
        font-weight: 700;
      }

      .vehicle-label {
        font-size: 11px;
        font-weight: 500;
      }

      /* Service Packages */
      .service-packages-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .service-package-item {
        display: flex;
        gap: 14px;
        padding: 14px;
        background: var(--card-bg);
        border-radius: 8px;
        border-left: 3px solid var(--accent-color);
        align-items: flex-start;
        transition: background 0.2s ease;
        cursor: pointer;

        &:hover {
          background: rgba(22, 163, 74, 0.1);
        }

        &.selected {
          background: rgba(22, 163, 74, 0.2);
          border-left-color: var(--accent-color);
        }
      }

      .service-number-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--accent-color);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        font-size: 12px;
        flex-shrink: 0;
      }

      .service-content {
        flex: 1;
      }

      .service-name {
        display: block;
        font-weight: 500;
        color: var(--text-light);
        font-size: 14px;
        margin-bottom: 6px;
      }

      .service-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tag {
        display: inline-block;
        font-size: 11px;
        padding: 4px 8px;
        background: rgba(22, 163, 74, 0.15);
        color: var(--accent-color);
        border-radius: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      /* Price Section */
      .price-section {
        margin-top: 32px;
      }

      .price-display-card {
        background: var(--card-bg);
        border-left: 3px solid var(--accent-color);
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }

      .price-label {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: capitalize;
        margin-bottom: 8px;
      }

      .price-amount {
        font-size: 36px;
        font-weight: 700;
        color: var(--accent-color);
        margin-bottom: 12px;
      }

      .price-details {
        font-size: 13px;
        color: var(--text-muted);

        strong {
          color: var(--text-light);
          font-weight: 600;
        }
      }

      /* Modal Footer */
      .modal-footer {
        padding: 20px 24px;
        background: var(--card-bg);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .book-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px !important;
        font-weight: 600;
        font-size: 14px;
        background: var(--accent-color) !important;
        color: white !important;
        text-transform: capitalize;
        border-radius: 6px !important;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        i {
          font-size: 16px;
        }
      }

      /* Responsive */
      @media (max-width: 600px) {
        .vehicle-types-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .price-amount {
          font-size: 28px;
        }

        .modal-header {
          padding: 16px 20px;
        }

        .modal-body {
          padding: 16px;
        }

        .modal-footer {
          padding: 16px;
        }
      }
    `,
  ],
})
export class PricingGuideModalComponent implements OnInit {
  selectedVehicleType: string | null = null;
  selectedService: string | null = null;

  vehicleLabels: Record<string, string> = {
    S: 'Sedan',
    M: 'SUV',
    L: 'Van',
    XL: 'Oversized',
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    // Initialize with first vehicle type
    if (this.data.vehicleTypeCodes && this.data.vehicleTypeCodes.length > 0) {
      this.selectedVehicleType = this.data.vehicleTypeCodes[0];
    }
    // Initialize with first service
    if (this.data.servicePackages && this.data.servicePackages.length > 0) {
      this.selectedService = this.data.servicePackages[0];
    }
  }

  selectVehicleType(type: string): void {
    this.selectedVehicleType = type;
  }

  selectService(service: string): void {
    this.selectedService = service;
  }

  getVehicleLabel(code: string): string {
    return this.vehicleLabels[code] || code;
  }

  extractServiceTags(service: string): string[] {
    // Extract tags from service description
    // e.g., "Wash + vacuum + hand wax -> exterior, interior, wax"
    if (!service) return [];

    const tagsSet = new Set<string>();

    // Check for common service components
    if (service.toLowerCase().includes('exterior')) tagsSet.add('exterior');
    if (service.toLowerCase().includes('interior')) tagsSet.add('interior');
    if (service.toLowerCase().includes('engine')) tagsSet.add('engine');
    if (service.toLowerCase().includes('wax')) tagsSet.add('wax');
    if (service.toLowerCase().includes('polish')) tagsSet.add('polish');
    if (service.toLowerCase().includes('vacuum')) tagsSet.add('vacuum');
    if (service.toLowerCase().includes('wash')) tagsSet.add('wash');

    return Array.from(tagsSet);
  }

  calculatePrice(): string {
    if (!this.selectedVehicleType || !this.selectedService) {
      return 'N/A';
    }

    try {
      // Find the service code based on selected service
      const serviceIndex = this.data.servicePackages.indexOf(this.selectedService);
      if (serviceIndex === -1) return 'N/A';

      const serviceCode = this.data.serviceCodes[serviceIndex];
      if (!serviceCode) return 'N/A';

      // Use the formatPrice method from the parent component
      return this.data.formatPrice(this.selectedVehicleType, serviceCode);
    } catch {
      return 'N/A';
    }
  }
}
