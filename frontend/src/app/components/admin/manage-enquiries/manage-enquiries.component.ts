import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClientModule } from '@angular/common/http';
import {
  ContactService,
  ContactEnquiry,
} from '../../../services/contact.service';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'replied' | 'archived';
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
    MatSelectModule,
    MatFormFieldModule,
    HttpClientModule,
  ],
  templateUrl: './manage-enquiries.component.html',
  styleUrl: './manage-enquiries.component.css',
})
export class ManageEnquiriesComponent implements OnInit {
  enquiries: Enquiry[] = [];
  isLoading = false;
  errorMessage = '';
  selectedStatus = 'all';

  constructor(
    private snackBar: MatSnackBar,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.loadEnquiries();
  }

  loadEnquiries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.contactService.getAllEnquiries().subscribe(
      (enquiries) => {
        this.enquiries = enquiries;
        this.isLoading = false;
      },
      (error) => {
        this.errorMessage = error.message || 'Failed to load enquiries';
        this.isLoading = false;
      }
    );
  }

  viewEnquiry(enquiry: Enquiry): void {
    // Mark as read if it's new
    if (enquiry.status === 'new') {
      this.updateEnquiryStatus(enquiry, 'read');
    }

    // Show enquiry details in a modal or expand the card
    this.showNotification(`Viewing enquiry from ${enquiry.name}`);
  }

  replyEnquiry(enquiry: Enquiry): void {
    // Update status to replied
    this.updateEnquiryStatus(enquiry, 'replied');

    // In the future, this will open a reply form or email client
    this.showNotification(`Reply sent to ${enquiry.email}`);
  }

  getFilteredEnquiries(): Enquiry[] {
    if (this.selectedStatus === 'all') {
      return this.enquiries;
    }
    return this.enquiries.filter(
      (enquiry) => enquiry.status === this.selectedStatus
    );
  }

  updateEnquiryStatus(
    enquiry: Enquiry,
    newStatus: 'new' | 'read' | 'replied' | 'archived'
  ): void {
    this.contactService.updateEnquiryStatus(enquiry.id, newStatus).subscribe(
      (response) => {
        if (response.success) {
          enquiry.status = newStatus;
          this.showNotification(`Enquiry status updated to ${newStatus}`);
        } else {
          this.showNotification('Failed to update status');
        }
      },
      (error) => {
        this.showNotification('Failed to update status: ' + error.message);
      }
    );
  }

  deleteEnquiry(enquiry: Enquiry): void {
    this.contactService.deleteEnquiry(enquiry.id).subscribe(
      (response) => {
        if (response.success) {
          const index = this.enquiries.findIndex((e) => e.id === enquiry.id);
          if (index > -1) {
            this.enquiries.splice(index, 1);
          }
          this.showNotification('Enquiry deleted successfully');
        } else {
          this.showNotification('Failed to delete enquiry');
        }
      },
      (error) => {
        this.showNotification('Failed to delete enquiry: ' + error.message);
      }
    );
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new':
        return '#ff9800'; // Orange
      case 'read':
        return '#2196f3'; // Blue
      case 'replied':
        return '#4caf50'; // Green
      case 'archived':
        return '#9e9e9e'; // Grey
      default:
        return '#9e9e9e';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'new':
        return 'fiber_new';
      case 'read':
        return 'visibility';
      case 'replied':
        return 'reply';
      case 'archived':
        return 'archive';
      default:
        return 'help';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  archiveEnquiry(enquiry: Enquiry): void {
    this.updateEnquiryStatus(enquiry, 'archived');
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
