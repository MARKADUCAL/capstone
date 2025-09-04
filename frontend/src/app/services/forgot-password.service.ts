import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ForgotPasswordResponse {
  status: {
    remarks: string;
    message: string;
  };
  payload: {
    reset_token?: string; // For testing only
    expires_at: string;
    customer_name?: string;
    admin_name?: string;
    employee_name?: string;
  } | null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Request password reset for customer
   */
  requestPasswordResetCustomer(
    email: string
  ): Observable<ForgotPasswordResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/request_password_reset_customer`,
      { email },
      { headers }
    );
  }

  /**
   * Request password reset for admin
   */
  requestPasswordResetAdmin(email: string): Observable<ForgotPasswordResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/request_password_reset_admin`,
      { email },
      { headers }
    );
  }

  /**
   * Request password reset for employee
   */
  requestPasswordResetEmployee(
    email: string
  ): Observable<ForgotPasswordResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/request_password_reset_employee`,
      { email },
      { headers }
    );
  }

  /**
   * Reset password using token
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post(
      `${this.apiUrl}/reset_password`,
      { token, new_password: newPassword },
      { headers }
    );
  }
}
