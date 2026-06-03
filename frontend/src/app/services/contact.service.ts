import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ContactEnquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'replied' | 'archived';
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Submit contact form
  submitContactForm(contactData: ContactForm): Observable<ContactResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/submit_contact`, contactData)
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return {
              success: true,
              message: response.status.message,
              data: response.payload,
            };
          } else {
            throw new Error(
              response?.status?.message || 'Failed to submit contact form',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to submit contact form. Please try again.'),
          );
        }),
      );
  }

  // Get all contact enquiries (for admin viewing)
  getAllEnquiries(): Observable<ContactEnquiry[]> {
    return this.http.get<any>(`${this.apiUrl}/get_contact_enquiries`).pipe(
      map((response) => {
        if (
          response &&
          response.status &&
          response.status.remarks === 'success'
        ) {
          return response.payload || [];
        } else {
          throw new Error(
            response?.status?.message || 'Failed to retrieve enquiries',
          );
        }
      }),
      catchError((error) => {
        return throwError(
          () => new Error('Failed to retrieve enquiries. Please try again.'),
        );
      }),
    );
  }

  // Update enquiry status
  updateEnquiryStatus(
    enquiryId: number,
    status: string,
  ): Observable<ContactResponse> {
    return this.http
      .put<any>(`${this.apiUrl}/update_contact_status`, {
        id: enquiryId,
        status,
      })
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return {
              success: true,
              message: response.status.message,
              data: response.payload,
            };
          } else {
            throw new Error(
              response?.status?.message || 'Failed to update enquiry status',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () =>
              new Error('Failed to update enquiry status. Please try again.'),
          );
        }),
      );
  }

  // Delete enquiry
  deleteEnquiry(enquiryId: number): Observable<ContactResponse> {
    return this.http
      .delete<any>(`${this.apiUrl}/delete_contact_enquiry/${enquiryId}`)
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return {
              success: true,
              message: response.status.message,
              data: response.payload,
            };
          } else {
            throw new Error(
              response?.status?.message || 'Failed to delete enquiry',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to delete enquiry. Please try again.'),
          );
        }),
      );
  }

  // Send verification code for contact form
  sendContactVerificationCode(email: string): Observable<ContactResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/send_contact_verification_code`, { email })
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return {
              success: true,
              message: response.status.message,
              data: response.payload,
            };
          } else {
            throw new Error(
              response?.status?.message || 'Failed to send verification code',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () =>
              new Error(
                error.message ||
                  'Failed to send verification code. Please try again.',
              ),
          );
        }),
      );
  }

  // Verify contact form verification code
  verifyContactCode(email: string, code: string): Observable<ContactResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/verify_contact_code`, { email, code })
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return {
              success: true,
              message: response.status.message,
              data: response.payload,
            };
          } else {
            throw new Error(
              response?.status?.message || 'Invalid verification code',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () =>
              new Error(
                error.message || 'Failed to verify code. Please try again.',
              ),
          );
        }),
      );
  }
}
