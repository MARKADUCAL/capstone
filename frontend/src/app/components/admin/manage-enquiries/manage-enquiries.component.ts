import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './manage-enquiries.component.html',
  styleUrl: './manage-enquiries.component.css',
})
export class ManageEnquiriesComponent implements OnInit {
  enquiries: Enquiry[] = [];
  isLoading = false;
  errorMessage = '';

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
    // Create Gmail compose URL with pre-filled email
    const subject = encodeURIComponent(`Re: ${enquiry.subject}`);
    const body = encodeURIComponent(
      `\n\n---\nOriginal Message:\nFrom: ${enquiry.name} <${enquiry.email}>\nSubject: ${enquiry.subject}\n\n${enquiry.message}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(enquiry.email)}&su=${subject}&body=${body}`;

    // Open Gmail in a new tab
    window.open(gmailUrl, '_blank');

    // Update status to replied after opening Gmail
    this.updateEnquiryStatus(enquiry, 'replied');
    this.showNotification(`Opening Gmail to reply to ${enquiry.name}`);
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


  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
