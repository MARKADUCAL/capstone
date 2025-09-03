import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-connection-test',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="connection-test-container">
      <h2>Frontend-Backend Connection Test</h2>

      <div class="test-section">
        <h3>Backend URL Configuration</h3>
        <p><strong>API URL:</strong> {{ apiUrl }}</p>
        <p>
          <strong>Environment:</strong>
          {{ isProduction ? 'Production' : 'Development' }}
        </p>
      </div>

      <div class="test-section">
        <h3>Connection Tests</h3>

        <button
          (click)="testBackendConnection()"
          [disabled]="isLoading"
          class="test-btn"
        >
          {{ isLoading ? 'Testing...' : 'Test Backend Connection' }}
        </button>

        <button
          (click)="testDatabaseConnection()"
          [disabled]="isLoading"
          class="test-btn"
        >
          {{ isLoading ? 'Testing...' : 'Test Database Connection' }}
        </button>
      </div>

      <div class="results" *ngIf="testResults.length > 0">
        <h3>Test Results</h3>
        <div
          *ngFor="let result of testResults"
          class="result-item"
          [ngClass]="result.type"
        >
          <strong>{{ result.test }}:</strong> {{ result.message }}
          <small>{{ result.timestamp }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .connection-test-container {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .test-section {
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }

      .test-btn {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        margin: 5px;
        border-radius: 4px;
        cursor: pointer;
      }

      .test-btn:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .test-btn:hover:not(:disabled) {
        background-color: #0056b3;
      }

      .results {
        margin-top: 20px;
      }

      .result-item {
        padding: 10px;
        margin: 5px 0;
        border-radius: 4px;
        border-left: 4px solid;
      }

      .result-item.success {
        background-color: #d4edda;
        border-left-color: #28a745;
        color: #155724;
      }

      .result-item.error {
        background-color: #f8d7da;
        border-left-color: #dc3545;
        color: #721c24;
      }

      .result-item.info {
        background-color: #d1ecf1;
        border-left-color: #17a2b8;
        color: #0c5460;
      }

      .result-item small {
        display: block;
        margin-top: 5px;
        opacity: 0.7;
      }
    `,
  ],
})
export class ConnectionTestComponent implements OnInit {
  apiUrl = environment.apiUrl;
  isProduction = environment.production;
  isLoading = false;
  testResults: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.addResult(
      'info',
      'Component Initialized',
      'Connection test component loaded successfully'
    );
  }

  testBackendConnection() {
    this.isLoading = true;
    this.addResult(
      'info',
      'Backend Connection Test',
      'Testing connection to backend...'
    );

    // Test basic backend connectivity
    this.http
      .get(`${this.apiUrl}/test_connection`, {
        observe: 'response',
        responseType: 'text',
      })
      .subscribe({
        next: (response) => {
          this.addResult(
            'success',
            'Backend Connection Test',
            `Backend is accessible! Status: ${response.status}`
          );
          this.isLoading = false;
        },
        error: (error) => {
          this.addResult(
            'error',
            'Backend Connection Test',
            `Failed to connect to backend: ${error.message || error.statusText}`
          );
          this.isLoading = false;
        },
      });
  }

  testDatabaseConnection() {
    this.isLoading = true;
    this.addResult(
      'info',
      'Database Connection Test',
      'Testing database connection...'
    );

    // Test database connection via the test endpoint we created
    this.http.get(`${this.apiUrl}/../test_connection.php`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.addResult(
            'success',
            'Database Connection Test',
            `Database connection successful! ${response.message}`
          );
        } else {
          this.addResult(
            'error',
            'Database Connection Test',
            `Database connection failed: ${response.message}`
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.addResult(
          'error',
          'Database Connection Test',
          `Database test failed: ${error.message || error.statusText}`
        );
        this.isLoading = false;
      },
    });
  }

  private addResult(type: string, test: string, message: string) {
    this.testResults.push({
      type,
      test,
      message,
      timestamp: new Date().toLocaleString(),
    });
  }
}
