import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CustomerFeedback {
  id?: number;
  booking_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  is_public: boolean;
  created_at?: string;
  customer_name?: string;
  service_name?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Submit customer feedback
  submitFeedback(feedback: CustomerFeedback): Observable<FeedbackResponse> {
    console.log('🔧 Service: submitFeedback called');
    console.log('📤 Feedback data:', feedback);

    return this.http
      .post<any>(`${this.apiUrl}/add_customer_feedback`, feedback)
      .pipe(
        map((response) => {
          console.log('📥 Raw backend response:', response);

          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            console.log('✅ Feedback submitted successfully');
            return {
              success: true,
              message: response.status.message,
              data: response.payload?.customer_feedback,
            };
          } else {
            console.log('❌ Feedback submission failed:', response);
            throw new Error(
              response?.status?.message || 'Failed to submit feedback'
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(
            () => new Error('Failed to submit feedback. Please try again.')
          );
        })
      );
  }

  // Get all customer feedback (for admin viewing)
  getAllFeedback(limit: number = 50): Observable<CustomerFeedback[]> {
    console.log('🔧 Service: getAllFeedback called');
    console.log('📊 Limit:', limit);
    console.log(
      '🌐 API URL:',
      `${this.apiUrl}/get_customer_feedback?limit=${limit}`
    );

    return this.http
      .get<any>(`${this.apiUrl}/get_customer_feedback?limit=${limit}`)
      .pipe(
        map((response) => {
          console.log('📥 Raw backend response:', response);

          if (
            response &&
            response.status &&
            response.status.remarks === 'success' &&
            response.payload &&
            response.payload.customer_feedback
          ) {
            console.log('✅ Feedback retrieved successfully');
            console.log(
              '📊 Feedback array:',
              response.payload.customer_feedback
            );
            return response.payload.customer_feedback;
          } else {
            console.log('❌ Failed to retrieve feedback:', response);
            throw new Error(
              response?.status?.message || 'Failed to retrieve feedback'
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(() => new Error('Failed to retrieve feedback.'));
        })
      );
  }

  // Get feedback for a specific booking
  getFeedbackByBookingId(bookingId: number): Observable<CustomerFeedback[]> {
    // This would need a new backend endpoint, but for now we'll get all and filter
    return this.getAllFeedback().pipe(
      map((feedbackList) =>
        feedbackList.filter((feedback) => feedback.booking_id === bookingId)
      )
    );
  }

  // Get feedback for a specific customer
  getFeedbackByCustomerId(customerId: number): Observable<CustomerFeedback[]> {
    // This would need a new backend endpoint, but for now we'll get all and filter
    return this.getAllFeedback().pipe(
      map((feedbackList) =>
        feedbackList.filter((feedback) => feedback.customer_id === customerId)
      )
    );
  }

  // Check if feedback exists for a specific booking
  checkFeedbackExists(bookingId: number): Observable<boolean> {
    return this.getAllFeedback().pipe(
      map((feedbackList) =>
        feedbackList.some((feedback) => feedback.booking_id === bookingId)
      )
    );
  }
}
