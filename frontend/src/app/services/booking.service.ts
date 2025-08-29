import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
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
        throwError(() => new Error('Failed to load bookings: ' + error.message))
      )
    );
  }

  // Admin: Get all bookings
  getAllBookings(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/get_all_bookings`).pipe(
      map((response) => response.payload.bookings),
      catchError((error) => {
        console.error('Error fetching all bookings:', error);
        return throwError(() => new Error('Failed to load bookings.'));
      })
    );
  }

  getBookingsByCustomerId(customerId: string): Observable<Booking[]> {
    console.log('Fetching bookings for customer ID:', customerId);
    console.log(
      'API URL:',
      `${environment.apiUrl}/get_bookings_by_customer?customer_id=${customerId}`
    );

    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_customer?customer_id=${customerId}`
      )
      .pipe(
        map((response) => {
          console.log('API Response:', response);
          if (response && response.payload && response.payload.bookings) {
            return response.payload.bookings;
          } else {
            console.warn('Unexpected response structure:', response);
            return [];
          }
        }),
        catchError((error) => {
          console.error('Error fetching bookings:', error);
          let errorMessage = 'Failed to load bookings.';

          if (error.status === 404) {
            errorMessage = 'No bookings found for this customer.';
          } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Create a new booking
  createBooking(bookingData: any): Observable<any> {
    // In a real app, this would call an API endpoint
    return this.http
      .post<any>(`${environment.apiUrl}/create_booking`, bookingData)
      .pipe(
        catchError((error) => {
          console.error('Error creating booking:', error);
          return throwError(
            () => new Error('Failed to create booking. Please try again later.')
          );
        })
      );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<boolean> {
    // In a real app, this would call an API endpoint
    // return this.http.delete<boolean>(`api/bookings/${bookingId}`);

    // For now, update the local array
    const index = this.mockBookings.findIndex(
      (booking) => booking.id === bookingId
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
            () => new Error('Failed to delete booking. Please try again later.')
          );
        })
      );
  }

  // Update booking status to paid
  payForBooking(bookingId: string): Observable<boolean> {
    // In a real app, this would call an API endpoint
    // return this.http.put<boolean>(`api/bookings/${bookingId}/pay`, {});

    // For now, update the local array
    const booking = this.mockBookings.find(
      (booking) => booking.id === bookingId
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
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
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
      | 'Completed'
      | 'Cancelled',
    reason?: string
  ): Observable<any> {
    const normalized = this.normalizeStatus(status);

    console.log('🔧 Service: updateBookingStatus called');
    console.log('🆔 Booking ID:', bookingId);
    console.log('📝 Original Status:', status);
    console.log('🔄 Normalized Status:', normalized);
    console.log('🌐 API URL:', `${environment.apiUrl}/update_booking_status`);

    const requestData: any = {
      id: bookingId,
      status: normalized,
    };

    if (reason && reason.trim().length > 0) {
      requestData.reason = reason.trim();
    }

    console.log('📤 Request data:', requestData);

    return this.http
      .put<any>(`${environment.apiUrl}/update_booking_status`, requestData)
      .pipe(
        map((response) => {
          console.log('📥 Raw backend response:', response);

          // Handle the backend response structure
          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            console.log('✅ Response indicates success');
            return { success: true, message: response.status.message };
          } else {
            console.log('❌ Response indicates failure:', response);
            throw new Error(
              response?.status?.message || 'Failed to update booking status'
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(
            () => new Error('Failed to update booking status.')
          );
        })
      );
  }

  assignEmployeeToBooking(
    bookingId: number,
    employeeId: number
  ): Observable<any> {
    console.log('🔧 Service: assignEmployeeToBooking called');
    console.log('🆔 Booking ID:', bookingId);
    console.log('👤 Employee ID:', employeeId);

    const requestData = {
      booking_id: bookingId,
      employee_id: employeeId,
    };

    console.log('📤 Request data:', requestData);

    return this.http
      .put<any>(`${environment.apiUrl}/assign_employee_to_booking`, requestData)
      .pipe(
        map((response) => {
          console.log('📥 Raw backend response:', response);

          if (
            response &&
            response.status &&
            response.status.remarks === 'success'
          ) {
            console.log('✅ Employee assigned successfully');
            return { success: true, message: response.status.message };
          } else {
            console.log('❌ Assignment failed:', response);
            throw new Error(
              response?.status?.message ||
                'Failed to assign employee to booking'
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(
            () => new Error('Failed to assign employee to booking.')
          );
        })
      );
  }

  getBookingsByEmployee(employeeId: number): Observable<any[]> {
    console.log('🔧 Service: getBookingsByEmployee called');
    console.log('👤 Employee ID:', employeeId);

    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_employee?employee_id=${employeeId}`
      )
      .pipe(
        map((response) => {
          console.log('📥 Raw backend response:', response);

          if (
            response &&
            response.status &&
            response.status.remarks === 'success' &&
            response.payload &&
            response.payload.bookings
          ) {
            console.log('✅ Employee bookings retrieved successfully');
            return response.payload.bookings;
          } else {
            console.log('❌ Failed to retrieve employee bookings:', response);
            throw new Error(
              response?.status?.message ||
                'Failed to retrieve employee bookings'
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(
            () => new Error('Failed to retrieve employee bookings.')
          );
        })
      );
  }

  private normalizeStatus(
    status:
      | BookingStatus
      | 'Pending'
      | 'Approved'
      | 'Rejected'
      | 'Completed'
      | 'Cancelled'
  ): 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled' {
    if (
      status === 'Pending' ||
      status === 'Approved' ||
      status === 'Rejected' ||
      status === 'Completed' ||
      status === 'Cancelled'
    ) {
      return status;
    }

    switch (status) {
      case BookingStatus.PENDING:
        return 'Pending';
      case BookingStatus.CONFIRMED:
        return 'Approved';
      case BookingStatus.COMPLETED:
        return 'Completed';
      case BookingStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Pending';
    }
  }
}
