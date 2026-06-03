import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, map, mergeMap, retryWhen } from 'rxjs/operators';
import { Booking, BookingForm, BookingStatus } from '../models/booking.model';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  // In a real implementation, this would be fetched from a backend API
  private mockBookings: Booking[] = [
    {
      id: '1',
      vehicleType: 'Sedan',
      services: 'Premium Wash',
      plateNumber: 'ABC-1234',
      vehicleModel: 'Toyota Camry',
      vehicleColor: 'White',
      firstName: 'John',
      lastName: 'Doe',
      nickname: 'John Doe',
      phone: '(123) 456-7890',
      additionalPhone: '',
      washDate: '2023-12-15',
      washTime: '10:30',
      paymentType: 'Online Payment - GCash',
      notes: 'Please take care of the rims',
      status: BookingStatus.CONFIRMED,
      dateCreated: '2023-12-01T14:30:00Z',
      price: 24.99,
    },
  ];

  constructor(private http: HttpClient) {}

  // Get all bookings for current user
  getBookings(): Observable<Booking[]> {
    // Using mock data instead of API call that's causing errors
    return of(this.mockBookings).pipe(
      delay(800), // Simulate network delay
      catchError((error) =>
        throwError(
          () => new Error('Failed to load bookings: ' + error.message),
        ),
      ),
    );
  }

  // Admin: Get all bookings
  getAllBookings(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/get_all_bookings`).pipe(
      map((response) => response.payload.bookings),
      catchError((error) => {
        console.error('Error fetching all bookings:', error);
        return throwError(() => new Error('Failed to load bookings.'));
      }),
    );
  }

  getBookingsByCustomerId(customerId: string): Observable<Booking[]> {
    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_customer?customer_id=${customerId}`,
      )
      .pipe(
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error, index) => {
              const retryAttempt = index + 1;
              const shouldRetry =
                retryAttempt <= 3 &&
                (error.status === 429 ||
                  (error.status >= 500 && error.status < 600));

              if (!shouldRetry) {
                return throwError(() => error);
              }

              return timer(1000 * Math.pow(2, index));
            }),
          ),
        ),
        map((response) => {
          if (response && response.payload && response.payload.bookings) {
            return response.payload.bookings;
          } else {
            return [];
          }
        }),
        catchError((error) => {
          let errorMessage = 'Failed to load bookings.';

          if (error.status === 429) {
            errorMessage =
              'Too many booking requests. Please wait before trying again.';
          } else if (error.status === 404) {
            errorMessage = 'No bookings found for this customer.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  // Create a new booking
  createBooking(bookingData: any): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/create_booking`, bookingData)
      .pipe(
        map((response) => {
          // Handle the backend response structure
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
              response?.status?.message || 'Failed to create booking',
            );
          }
        }),
        catchError((error) => {
          let errorMessage =
            'Failed to create booking. Please try again later.';

          if (error.status === 400) {
            errorMessage =
              error.error?.status?.message ||
              'Invalid booking data. Please check your inputs.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (
            error.error &&
            error.error.status &&
            error.error.status.message
          ) {
            errorMessage = error.error.status.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<boolean> {
    // In a real app, this would call an API endpoint
    // return this.http.delete<boolean>(`api/bookings/${bookingId}`);

    // For now, update the local array
    const index = this.mockBookings.findIndex(
      (booking) => booking.id === bookingId,
    );
    if (index !== -1) {
      this.mockBookings[index].status = BookingStatus.CANCELLED;
      return of(true).pipe(delay(500));
    }

    return of(false).pipe(delay(500));
  }

  // Delete a booking permanently
  deleteBooking(bookingId: string): Observable<boolean> {
    return this.http
      .delete<any>(`${environment.apiUrl}/bookings/${bookingId}`)
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Error deleting booking:', error);
          return throwError(
            () =>
              new Error('Failed to delete booking. Please try again later.'),
          );
        }),
      );
  }

  // Update booking status to paid
  payForBooking(bookingId: string): Observable<boolean> {
    // In a real app, this would call an API endpoint
    // return this.http.put<boolean>(`api/bookings/${bookingId}/pay`, {});

    // For now, update the local array
    const booking = this.mockBookings.find(
      (booking) => booking.id === bookingId,
    );
    if (booking) {
      booking.status = BookingStatus.CONFIRMED;
      return of(true).pipe(delay(500));
    }

    return of(false).pipe(delay(500));
  }

  // Mock function to calculate price based on selected service
  private calculatePrice(serviceName: string): number {
    switch (serviceName) {
      case 'Basic Wash':
        return 15.99;
      case 'Premium Wash':
        return 24.99;
      case 'Deluxe Package':
        return 34.99;
      case 'Complete Detail':
        return 89.99;
      case 'Express Wash':
        return 9.99;
      default:
        return 19.99; // Default price
    }
  }

  // Get available time slots for a given date
  getAvailableTimeSlots(date: string): Observable<string[]> {
    // In a real app, this would fetch from the backend
    // return this.http.get<string[]>(`api/timeslots?date=${date}`);

    // For demo, return mock time slots
    const mockTimeSlots = [
      '07:00',
      '07:30',
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
      '19:30',
    ];

    return of(mockTimeSlots).pipe(delay(300));
  }

  updateBookingStatus(
    bookingId: number | string,
    status:
      | BookingStatus
      | 'Pending'
      | 'Approved'
      | 'Rejected'
      | 'Done'
      | 'Completed'
      | 'Cancelled'
      | 'Expired',
    reason?: string,
  ): Observable<any> {
    const normalized = this.normalizeStatus(status);

    const requestData: any = {
      id: bookingId,
      status: normalized,
    };

    if (reason && reason.trim().length > 0) {
      requestData.reason = reason.trim();
    }

    return this.http
      .put<any>(`${environment.apiUrl}/update_booking_status`, requestData)
      .pipe(
        map((response) => {
          // Handle the backend response structure
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return { success: true, message: response.status.message };
          } else {
            throw new Error(
              response?.status?.message || 'Failed to update booking status',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to update booking status.'),
          );
        }),
      );
  }

  assignEmployeeToBooking(
    bookingId: number,
    employeeId: number,
  ): Observable<any> {
    const requestData = {
      booking_id: bookingId,
      employee_id: employeeId,
    };

    return this.http
      .put<any>(`${environment.apiUrl}/assign_employee_to_booking`, requestData)
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            return { success: true, message: response.status.message };
          } else {
            throw new Error(
              response?.status?.message ||
                'Failed to assign employee to booking',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to assign employee to booking.'),
          );
        }),
      );
  }

  getBookingsByEmployee(employeeId: number): Observable<any[]> {
    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_employee?employee_id=${employeeId}`,
      )
      .pipe(
        map((response) => {
          if (
            response &&
            response.status &&
            response.status.remarks === 'success' &&
            response.payload &&
            response.payload.bookings
          ) {
            return response.payload.bookings;
          } else {
            throw new Error(
              response?.status?.message ||
                'Failed to retrieve employee bookings',
            );
          }
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to retrieve employee bookings.'),
          );
        }),
      );
  }

  private normalizeStatus(
    status:
      | BookingStatus
      | 'Pending'
      | 'Approved'
      | 'Rejected'
      | 'Done'
      | 'Completed'
      | 'Cancelled'
      | 'Expired',
  ):
    | 'Pending'
    | 'Approved'
    | 'Rejected'
    | 'Done'
    | 'Completed'
    | 'Cancelled'
    | 'Expired' {
    if (
      status === 'Pending' ||
      status === 'Approved' ||
      status === 'Rejected' ||
      status === 'Done' ||
      status === 'Completed' ||
      status === 'Cancelled' ||
      status === 'Expired'
    ) {
      return status;
    }

    switch (status) {
      case BookingStatus.PENDING:
        return 'Pending';
      case BookingStatus.CONFIRMED:
        return 'Approved';
      case BookingStatus.DONE:
        return 'Done';
      case BookingStatus.COMPLETED:
        return 'Completed';
      case BookingStatus.CANCELLED:
        return 'Cancelled';
      case BookingStatus.EXPIRED:
        return 'Expired';
      default:
        return 'Pending';
    }
  }
}
