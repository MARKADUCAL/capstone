import { Component, Inject } from '@angular/core';
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
        <h2>
          <i class="fas fa-calculator"></i>
          Pricing Guide
        </h2>
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
          <h4>
            <span class="step-number">Step 1:</span>
            Identify Vehicle Type
          </h4>
          <div class="vehicle-types-list">
            <div class="vehicle-type-item">
              <span class="vehicle-code">S:</span>
              <span class="vehicle-desc">Sedans (all sedan types)</span>
            </div>
            <div class="vehicle-type-item">
              <span class="vehicle-code">M:</span>
              <span class="vehicle-desc">SUVs (all SUV types)</span>
            </div>
            <div class="vehicle-type-item">
              <span class="vehicle-code">L:</span>
              <span class="vehicle-desc">VANs (any type of van)</span>
            </div>
            <div class="vehicle-type-item">
              <span class="vehicle-code">XL:</span>
              <span class="vehicle-desc">
                Larger than vans (big SUVs/pickups, oversized vehicles)
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Service Packages -->
        <div class="pricing-step">
          <h4>
            <span class="step-number">Step 2:</span>
            Select Services
          </h4>
          <div class="service-packages-list">
            <div
              *ngFor="let service of data.servicePackages; let i = index"
              class="service-package-item"
            >
              <span class="service-code">{{ i + 1 }}:</span>
              <span class="service-desc">{{
                data.extractServiceDescription(service)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Step 3: Pricing Table -->
        <div class="pricing-step">
          <h4>
            <span class="step-number">Step 3:</span>
            Determine Price
          </h4>
          <div class="pricing-table">
            <div class="pricing-header">
              <div class="header-cell">Vehicle</div>
              <div
                class="header-cell"
                *ngFor="let serviceCode of data.serviceCodes"
              >
                {{ serviceCode.replace("p", "") }}
              </div>
            </div>
            <div
              class="pricing-row"
              *ngFor="let vehicleCode of data.vehicleTypeCodes"
            >
              <div class="vehicle-cell">{{ vehicleCode }}</div>
              <div
                class="price-cell"
                *ngFor="let serviceCode of data.serviceCodes"
              >
                {{ data.formatPrice(vehicleCode, serviceCode) }}
              </div>
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
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 2px solid #f0f0f0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        margin: -24px -24px 0 -24px;
        border-radius: 4px 4px 0 0;

        h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;

          i {
            font-size: 28px;
          }
        }
      }

      .close-btn {
        color: white;

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
      }

      .pricing-step {
        margin-bottom: 32px;

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;

          .step-number {
            color: #667eea;
            font-weight: 700;
            background: #f0f0ff;
            padding: 4px 12px;
            border-radius: 20px;
          }
        }
      }

      .vehicle-types-list,
      .service-packages-list {
        display: grid;
        gap: 12px;
      }

      .vehicle-type-item,
      .service-package-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-left: 4px solid #667eea;
        border-radius: 4px;
        align-items: flex-start;
      }

      .vehicle-code,
      .service-code {
        font-weight: 700;
        color: #667eea;
        min-width: 40px;
        font-size: 14px;
      }

      .vehicle-desc,
      .service-desc {
        color: #555;
        font-size: 14px;
        flex: 1;
      }

      .pricing-table {
        overflow-x: auto;
        margin-top: 16px;
      }

      .pricing-header,
      .pricing-row {
        display: grid;
        gap: 10px;
        padding: 12px;
        background: #f8f9fa;
        margin-bottom: 8px;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }

      .pricing-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        sticky: 0;
        z-index: 10;
      }

      .header-cell,
      .vehicle-cell,
      .price-cell {
        padding: 8px;
        text-align: center;
        font-weight: 500;
      }

      .header-cell {
        color: white;
        font-size: 13px;
      }

      .vehicle-cell {
        font-weight: 700;
        color: #667eea;
      }

      .price-cell {
        color: #333;
        font-size: 14px;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .pricing-table {
          font-size: 12px;
        }

        .header-cell,
        .vehicle-cell,
        .price-cell {
          padding: 6px;
          font-size: 11px;
        }

        .modal-header h2 {
          font-size: 18px;
        }

        .pricing-step h4 {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class PricingGuideModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
