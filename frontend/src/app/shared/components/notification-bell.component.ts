import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AppNotification,
  NotificationService,
} from '../../services/notification.service';
import { TimezonePipe } from '../pipes/timezone.pipe';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TimezonePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: AppNotification[] = [];
  dropdownOpen = false;
  currentPage = 1;
  totalPages = 1;
  perPage = 5;
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.unreadCount.subscribe(
      (count) => {
        this.unreadCount = count;
      },
    );
    this.notificationService.startPolling();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.currentPage = 1;
      this.loadNotifications();
    }
  }

  onNotifClick(notification: AppNotification) {
    if (notification.is_read === 1) return;

    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.is_read = 1;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications = this.notifications.map((notification) => ({
        ...notification,
        is_read: 1,
      }));
      this.unreadCount = 0;
    });
  }

  previousPage(event: Event) {
    event.stopPropagation();
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.loadNotifications();
  }

  nextPage(event: Event) {
    event.stopPropagation();
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.loadNotifications();
  }


  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
  }

  private loadNotifications() {
    this.notificationService
      .getNotifications(this.currentPage, this.perPage)
      .subscribe((response) => {
        this.notifications = response.notifications || [];
        this.unreadCount = response.unread_count || 0;
        this.totalPages = response.total_pages || 1;
        this.currentPage = response.page || this.currentPage;
      });
  }
}
