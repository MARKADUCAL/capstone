import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CustomerBooking {
  id: number;
  customerName: string;
  service: string;
  date: Date;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}

@Component({
  selector: 'app-customer-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-records.component.html',
  styleUrl: './customer-records.component.css',
})
export class CustomerRecordsComponent implements OnInit {
  customerBookings: CustomerBooking[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';

  ngOnInit() {
    // Sample data - replace this with actual API call in production
    this.customerBookings = [
      {
        id: 1,
        customerName: 'John Doe',
        service: 'Haircut',
        date: new Date('2024-03-20'),
        time: '10:00 AM',
        status: 'Confirmed',
      },
      {
        id: 2,
        customerName: 'Jane Smith',
        service: 'Manicure',
        date: new Date('2024-03-21'),
        time: '2:30 PM',
        status: 'Pending',
      },
    ];
  }

  get filteredBookings(): CustomerBooking[] {
    return this.customerBookings.filter((booking) => {
      const matchesSearch =
        booking.customerName
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        booking.service.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus =
        this.statusFilter === 'all' || booking.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  updateStatus(
    booking: CustomerBooking,
    newStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  ) {
    booking.status = newStatus;
  }
}
