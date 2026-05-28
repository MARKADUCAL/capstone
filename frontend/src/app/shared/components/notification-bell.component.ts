import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppNotification, NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: AppNotification[] = [];
  dropdownOpen = false;
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.unreadCount.subscribe((count) => {
      this.unreadCount = count;
    });
    this.notificationService.startPolling();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.loadNotifications();
    }
  }

  onNotifClick(notification: AppNotification) {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.notifications = this.notifications.filter((item) => item.id !== notification.id);
    });
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications = [];
    });
  }

  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
  }

  private loadNotifications() {
    this.notificationService.getNotifications().subscribe((response) => {
      this.notifications = response.notifications || [];
      this.unreadCount = response.unread_count || 0;
    });
  }
}
