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
      nickname: 'John Doe',
      phone: '(123) 456-7890',
      washDate: '2023-12-15',
      washTime: '10:30',
      paymentType: 'Credit/Debit Card',
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

  getBookingsByCustomerId(customerId: string): Observable<Booking[]> {
    return this.http
      .get<any>(
        `${environment.apiUrl}/get_bookings_by_customer?customer_id=${customerId}`
      )
      .pipe(
        map((response) => response.payload.bookings),
        catchError((error) => {
          console.error('Error fetching bookings:', error);
          return throwError(() => new Error('Failed to load bookings.'));
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
    bookingId: string,
    status: BookingStatus
  ): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${bookingId}`, { status });
  }
}
