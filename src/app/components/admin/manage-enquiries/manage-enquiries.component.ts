import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedDate: string;
  receivedTime: string;
}

@Component({
  selector: 'app-manage-enquiries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './manage-enquiries.component.html',
  styleUrl: './manage-enquiries.component.css',
})
export class ManageEnquiriesComponent implements OnInit {
  enquiries: Enquiry[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Inquiry about pricing',
      message: 'I had trouble booking...',
      receivedDate: '2022-02-20',
      receivedTime: '10:30pm',
    },
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load enquiries data
  }

  viewEnquiry(enquiry: Enquiry): void {
    // Implement view enquiry details functionality
  }

  replyEnquiry(enquiry: Enquiry): void {
    // Implement reply functionality
  }

  deleteEnquiry(enquiry: Enquiry): void {
    const index = this.enquiries.findIndex((e) => e.id === enquiry.id);
    if (index > -1) {
      this.enquiries.splice(index, 1);
      this.showNotification('Enquiry deleted successfully');
    }
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
