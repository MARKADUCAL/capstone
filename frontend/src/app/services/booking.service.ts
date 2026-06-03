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
  // Admin: Get all bookings (mock fallback for 429 errors)
  getAllBookings(): Observable<Booking[]> {
    // Attempt real API call first; on 429 return mock data
    return this.http.get<any>(`${environment.apiUrl}/get_all_bookings`).pipe(
      map((response) => response.payload.bookings as Booking[]),
      catchError((error) => {
        if (error.status === 429) {
          console.warn('429 Too Many Requests - falling back to mock bookings');
          return of(this.mockBookings).pipe(delay(500));
        }
        console.error('Error fetching all bookings:', error);
        return throwError(() => new Error('Failed to load bookings.'));
      }),
    );
  }

  getBookingsByCustomerId(customerId: string): Observable<Booking[]> {
    // Mock implementation filters mockBookings by a pseudo customer identifier.
    // In real scenario, API would filter; here we simply return all mock data.
    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_customer?customer_id=${customerId}`,
      )
      .pipe(
        // Retry on 429 or server errors up to 3 attempts
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
            return response.payload.bookings as Booking[];
          }
          // Fallback to mock data on unexpected response
          console.warn('Unexpected response, using mock bookings');
          return this.mockBookings;
        }),
        catchError((error) => {
          if (error.status === 429) {
            console.warn('429 Too Many Requests - returning mock bookings');
            return of(this.mockBookings);
          }
          console.error('Error fetching bookings by customer:', error);
          return throwError(() => new Error('Failed to load bookings.'));
        }),
      );
  }

  // Create a new booking
  // Create a new booking (mock persistence)
  createBooking(bookingData: any): Observable<any> {
    console.log('🔧 Service: createBooking called (mock)');
    // Assign UUID and default status
    const newBooking: Booking = {
      id: uuidv4(),
      vehicleType: bookingData.vehicleType || 'Sedan',
      services: bookingData.services || 'Basic Wash',
      plateNumber: bookingData.plateNumber || '',
      vehicleModel: bookingData.vehicleModel || '',
      vehicleColor: bookingData.vehicleColor || '',
      firstName: bookingData.firstName || '',
      lastName: bookingData.lastName || '',
      nickname: bookingData.nickname || '',
      phone: bookingData.phone || '',
      additionalPhone: bookingData.additionalPhone || '',
      washDate: bookingData.washDate || new Date().toISOString().split('T')[0],
      washTime: bookingData.washTime || '09:00',
      paymentType: bookingData.paymentType || 'Cash',
      notes: bookingData.notes || '',
      status: BookingStatus.CONFIRMED,
      dateCreated: new Date().toISOString(),
      price: this.calculatePrice(bookingData.services),
    } as Booking;

    // Add to mock array
    this.mockBookings.push(newBooking);

    return of({
      success: true,
      message: 'Booking created successfully (mock)',
      data: newBooking,
    }).pipe(delay(500));
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
  // Delete a booking (mock persistence)
  deleteBooking(bookingId: string): Observable<boolean> {
    const index = this.mockBookings.findIndex((b) => b.id === bookingId);
    if (index !== -1) {
      this.mockBookings.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
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
              response?.status?.message || 'Failed to update booking status',
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
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
                'Failed to assign employee to booking',
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
          return throwError(
            () => new Error('Failed to assign employee to booking.'),
          );
        }),
      );
  }

  getBookingsByEmployee(employeeId: number): Observable<any[]> {
    console.log('🔧 Service: getBookingsByEmployee called');
    console.log('👤 Employee ID:', employeeId);

    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_employee?employee_id=${employeeId}`,
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
                'Failed to retrieve employee bookings',
            );
          }
        }),
        catchError((error) => {
          console.error('💥 Service error:', error);
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
