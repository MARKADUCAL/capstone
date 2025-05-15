import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CarWashBooking {
  id: number;
  customerName: string;
  vehicleType: 'small' | 'medium' | 'large';
  date: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  serviceType?: string;
  price?: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-car-wash-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './car-wash-booking.component.html',
  styleUrl: './car-wash-booking.component.css',
})
export class CarWashBookingComponent implements OnInit {
  bookings: CarWashBooking[] = [
    {
      id: 1,
      customerName: 'John Doe',
      vehicleType: 'small',
      date: 'March 03, 2023',
      time: '12:00pm',
      status: 'Pending',
      imageUrl: 'assets/images/profile-placeholder.jpg',
    },
  ];

  selectedStatus: string = 'Pending';

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load bookings data
  }

  addBooking(): void {
    // Implement add booking functionality
  }

  addSlotBooking(): void {
    // Implement add slot booking functionality
  }

  approveBooking(booking: CarWashBooking): void {
    booking.status = 'Approved';
    this.showNotification('Booking approved successfully');
  }

  rejectBooking(booking: CarWashBooking): void {
    booking.status = 'Rejected';
    this.showNotification('Booking rejected successfully');
  }

  viewBooking(booking: CarWashBooking): void {
    // Implement view booking details functionality
  }

  filterBookings(status: string): CarWashBooking[] {
    return this.bookings.filter(
      (booking) =>
        this.selectedStatus === 'All' || booking.status === this.selectedStatus
    );
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  completeBooking(booking: CarWashBooking): void {
    booking.status = 'Completed';
    this.showNotification('Booking marked as completed');
  }
}
