import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-employee-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-register.component.html',
  styleUrl: './employee-register.component.css',
  host: { ngSkipHydration: 'true' },
})
export class EmployeeRegisterComponent implements OnInit {
  employee = {
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    position: '',
  };

  termsAccepted = false;
  errorMessage = '';
  isLoading = false;
  isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.prefillNextEmployeeId();
  }

  private prefillNextEmployeeId(): void {
    // Fetch all employees and compute the smallest available ID (EMP-XXX)
    this.http.get<any>(`${environment.apiUrl}/get_all_employees`).subscribe({
      next: (response) => {
        const employees = response?.payload?.employees || [];

        // Build a set of used numeric identifiers
        const usedNumbers = new Set<number>();
        for (const emp of employees) {
          const numeric =
            typeof emp.id === 'number' && emp.id > 0
              ? emp.id
              : this.parseEmployeeIdNumber(emp.employee_id);
          if (numeric > 0) usedNumbers.add(numeric);
        }

        // Find the smallest missing positive integer starting from 1
        let candidate = 1;
        while (usedNumbers.has(candidate)) {
          candidate += 1;
        }

        this.employee.employee_id = this.formatEmployeeId(candidate);
      },
      error: () => {
        // Fallback to first ID if request fails
        if (!this.employee.employee_id) {
          this.employee.employee_id = this.formatEmployeeId(1);
        }
      },
    });
  }

  private parseEmployeeIdNumber(employeeId: string): number {
    if (!employeeId || typeof employeeId !== 'string') return 0;
    const match = employeeId.match(/EMP-(\d{1,})$/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  private formatEmployeeId(n: number): string {
    return `EMP-${n.toString().padStart(3, '0')}`;
  }

  onSubmit(): void {
    // Reset error message
    this.errorMessage = '';
    this.isLoading = true;

    // For debug without leaking secrets
    console.log('Employee registration submitted:', {
      ...this.employee,
      password: '[REDACTED]',
      confirm_password: '[REDACTED]',
      termsAccepted: this.termsAccepted,
    });

    // Add terms validation
    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions';
      this.isLoading = false;
      return;
    }

    // Basic validation for required fields
    if (
      !this.employee.first_name ||
      !this.employee.last_name ||
      !this.employee.email ||
      !this.employee.phone ||
      !this.employee.password ||
      !this.employee.confirm_password ||
      !this.employee.employee_id ||
      !this.employee.position
    ) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    if (this.employee.password !== this.employee.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    // Password length validation
    if (this.employee.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      this.isLoading = false;
      return;
    }

    // Phone number validation (11 digits)
    if (!/^\d{11}$/.test(this.employee.phone)) {
      this.errorMessage = 'Phone number must be exactly 11 digits';
      this.isLoading = false;
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.employee.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    const registrationData = {
      employee_id: this.employee.employee_id,
      first_name: this.employee.first_name,
      last_name: this.employee.last_name,
      email: this.employee.email,
      phone: this.employee.phone,
      password: this.employee.password,
      position: this.employee.position,
    };

    console.log('Sending employee registration to API:', {
      ...registrationData,
      password: '[REDACTED]',
    });

    this.http
      .post(`${environment.apiUrl}/register_employee`, registrationData, {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Response:', response);
          if (response.status.remarks === 'success') {
            // Show success message before redirecting (only if in browser)
            if (this.isBrowser) {
              try {
                alert('Registration successful! Please login.');
              } catch (err) {
                console.error('Error with browser API:', err);
              }
            }
            this.router.navigate(['/employee-login']);
          } else {
            this.errorMessage =
              response.status.message || 'Registration failed';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error', error);
          if (error.error?.status?.message) {
            this.errorMessage = error.error.status.message;
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to server. Please try again later.';
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        },
      });
  }
}
