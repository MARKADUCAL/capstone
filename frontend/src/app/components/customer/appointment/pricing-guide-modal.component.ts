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
                  <span
                    class="tag"
                    *ngFor="let tag of extractServiceTags(service)"
                  >
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
    </div>
  `,
  styles: [
    `
      .pricing-modal-content {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
        border-radius: 20px;
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 28px;
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        color: white;
      }

      .header-branding h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
        letter-spacing: -0.5px;
      }

      .close-btn {
        color: white;
        opacity: 0.85;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 8px !important;

        &:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.25) !important;
          transform: rotate(90deg);
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
        padding: 32px;
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(10px);
      }

      .pricing-step {
        margin-bottom: 36px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;

        h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-dark);
          text-transform: capitalize;
          letter-spacing: -0.3px;
        }
      }

      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%);
        color: white;
        border-radius: 50%;
        font-weight: 700;
        font-size: 15px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(52, 61, 255, 0.2);
      }

      /* Vehicle Type Buttons */
      .vehicle-types-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .vehicle-type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 12px;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        color: var(--text-dark);
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        &:hover {
          border-color: var(--primary);
          background: rgba(0, 92, 187, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 92, 187, 0.15);
        }

        &.selected {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 6px 20px rgba(0, 92, 187, 0.3);
        }
      }

      .vehicle-code {
        font-size: 20px;
        font-weight: 700;
      }

      .vehicle-label {
        font-size: 12px;
        font-weight: 500;
        opacity: 0.8;
      }

      /* Service Packages */
      .service-packages-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .service-package-item {
        display: flex;
        gap: 16px;
        padding: 18px;
        background: white;
        border-left: 4px solid var(--accent);
        border-radius: 12px;
        align-items: flex-start;
        transition: all 0.3s ease;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid #f0f0f0;

        &:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(0, 92, 187, 0.12);
          background: rgba(0, 92, 187, 0.03);
        }

        &.selected {
          background: rgba(0, 92, 187, 0.08);
          border-left-color: var(--primary);
          border-left-width: 5px;
        }
      }

      .service-number-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%);
        color: white;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        flex-shrink: 0;
      }

      .service-content {
        flex: 1;
      }

      .service-name {
        display: block;
        font-weight: 600;
        color: var(--text-dark);
        font-size: 15px;
        margin-bottom: 8px;
      }

      .service-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tag {
        display: inline-block;
        font-size: 11px;
        padding: 4px 10px;
        background: linear-gradient(135deg, rgba(0, 92, 187, 0.1) 0%, rgba(52, 61, 255, 0.1) 100%);
        color: var(--primary);
        border-radius: 14px;
        font-weight: 500;
        text-transform: capitalize;
        border: 1px solid rgba(0, 92, 187, 0.2);
      }

      /* Price Section */
      .price-section {
        margin-top: 32px;
        padding-top: 32px;
        border-top: 2px solid #f0f0f0;
      }

      .price-display-card {
        background: linear-gradient(135deg, rgba(0, 92, 187, 0.08) 0%, rgba(52, 61, 255, 0.08) 100%);
        border-left: 5px solid var(--primary);
        padding: 28px;
        border-radius: 16px;
        text-align: center;
        border: 1px solid #e8f0ff;
        box-shadow: 0 4px 12px rgba(0, 92, 187, 0.08);
      }

      .price-label {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .price-amount {
        font-size: 44px;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 12px;
      }

      .price-details {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7);
        font-weight: 500;

        strong {
          color: var(--primary);
          font-weight: 700;
        }
      }

      /* Modal Footer */
      .modal-footer {
        padding: 24px 32px;
        background: rgba(255, 255, 255, 0.95);
        border-top: 1px solid #f0f0f0;
        backdrop-filter: blur(10px);
      }

      .book-btn {
        width: 100%;
        display: flex !important;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 16px 24px !important;
        font-weight: 600;
        font-size: 15px;
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%) !important;
        color: white !important;
        text-transform: capitalize;
        border-radius: 12px !important;
        transition: all 0.3s ease;
        border: none !important;
        letter-spacing: -0.3px;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 92, 187, 0.35);
        }

        i {
          font-size: 18px;
        }
      }

      /* Scrollbar styling */
      .modal-body::-webkit-scrollbar {
        width: 6px;
      }

      .modal-body::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }

      .modal-body::-webkit-scrollbar-thumb {
        background: rgba(0, 92, 187, 0.3);
        border-radius: 10px;

        &:hover {
          background: rgba(0, 92, 187, 0.5);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .modal-body {
          padding: 20px;
        }

        .vehicle-types-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .price-amount {
          font-size: 36px;
        }

        .modal-header {
          padding: 20px;
        }

        .header-branding h2 {
          font-size: 20px;
        }

        .step-header h4 {
          font-size: 16px;
        }

        .price-display-card {
          padding: 20px;
        }
      }

      @media (max-width: 480px) {
        .vehicle-types-buttons {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .vehicle-type-btn {
          padding: 12px 8px;
        }

        .vehicle-code {
          font-size: 18px;
        }

        .price-amount {
          font-size: 32px;
        }

        .service-package-item {
          padding: 14px;
          gap: 12px;
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
      const serviceIndex = this.data.servicePackages.indexOf(
        this.selectedService,
      );
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
