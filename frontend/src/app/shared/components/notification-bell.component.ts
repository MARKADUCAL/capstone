import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AppNotification,
  NotificationService,
} from '../../services/notification.service';
import { TimezonePipe } from '../pipes/timezone.pipe';
import { RelativeTimePipe } from '../pipes/relative-time.pipe';

interface NotificationGroup {
  date: string;
  notifications: AppNotification[];
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TimezonePipe, RelativeTimePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @ViewChild('notificationList') notificationList: ElementRef | null = null;

  unreadCount = 0;
  notifications: AppNotification[] = [];
  groupedNotifications: NotificationGroup[] = [];
  dropdownOpen = false;
  currentPage = 1;
  totalPages = 1;
  perPage = 10;
  isLoadingMore = false;
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
      if (this.notifications.length === 0) {
        this.currentPage = 1;
        this.loadNotifications();
      }
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
      this.groupedNotifications = this.groupNotificationsByDate(this.notifications);
      this.unreadCount = 0;
    });
  }

  loadMore(event: Event) {
    event.stopPropagation();
    if (this.currentPage >= this.totalPages || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.currentPage++;
    this.loadNotifications(true);
  }

  private groupNotificationsByDate(notifications: AppNotification[]): NotificationGroup[] {
    const groups: { [key: string]: AppNotification[] } = {};

    notifications.forEach((notif) => {
      const date = this.getDateLabel(notif.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notif);
    });

    return Object.keys(groups)
      .sort((a, b) => this.compareDateLabels(a, b))
      .map((date) => ({
        date,
        notifications: groups[date],
      }));
  }

  private getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const phtDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const now = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));

    const diffMs = now.getTime() - phtDate.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[phtDate.getMonth()];
    const day = phtDate.getDate();
    return `${month} ${day}`;
  }

  private compareDateLabels(a: string, b: string): number {
    const order = ['Today', 'Yesterday'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
  }

  private loadNotifications(append = false) {
    this.notificationService
      .getNotifications(this.currentPage, this.perPage)
      .subscribe((response) => {
        const newNotifications = response.notifications || [];

        if (append) {
          this.notifications = [...this.notifications, ...newNotifications];
        } else {
          this.notifications = newNotifications;
        }

        this.groupedNotifications = this.groupNotificationsByDate(this.notifications);
        this.unreadCount = response.unread_count || 0;
        this.totalPages = response.total_pages || 1;
        this.currentPage = response.page || this.currentPage;
        this.isLoadingMore = false;
      });
  }
}

