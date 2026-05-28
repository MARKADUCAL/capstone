import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: number;
  user_role: string;
  user_id: number;
  type: string;
  message: string;
  data: any;
  is_read: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  unreadCount = new BehaviorSubject<number>(0);
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  startPolling() {
    if (this.pollingSubscription) return;

    this.fetchUnreadCount().subscribe();
    // Increased interval from 15s to 30s to reduce API load
    this.pollingSubscription = interval(30000)
      .pipe(switchMap(() => this.fetchUnreadCount()))
      .subscribe();
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.unreadCount.next(0);
  }

  getNotifications(page = 1, perPage = 5) {
    return this.http
      .get<any>(`${environment.apiUrl}/notifications?page=${page}&per_page=${perPage}`, { headers: this.getHeaders() })
      .pipe(
        map((response) => response.payload || { notifications: [], unread_count: 0, total: 0, page, per_page: perPage, total_pages: 1 }),
        catchError(() => of({ notifications: [], unread_count: 0, total: 0, page, per_page: perPage, total_pages: 1 }))
      );
  }

  markAsRead(id: number) {
    return this.http
      .post<any>(`${environment.apiUrl}/notifications/read`, { id }, { headers: this.getHeaders() })
      .pipe(switchMap(() => this.fetchUnreadCount()));
  }

  markAllAsRead() {
    return this.http
      .post<any>(`${environment.apiUrl}/notifications/read-all`, {}, { headers: this.getHeaders() })
      .pipe(switchMap(() => this.fetchUnreadCount()));
  }

  private fetchUnreadCount() {
    return this.http
      .get<any>(`${environment.apiUrl}/notifications/count`, { headers: this.getHeaders() })
      .pipe(
        map((response) => {
          const count = response?.payload?.unread_count ?? 0;
          this.unreadCount.next(count);
          return count;
        }),
        catchError((error) => {
          // If rate limited (429), don't spam console
          if (error.status !== 429) {
            console.error('Error fetching notification count:', error);
          }
          this.unreadCount.next(0);
          return of(0);
        })
      );
  }

  private getHeaders(): HttpHeaders {
    // Get the current user's role from localStorage to determine which token to use
    const userRole = localStorage.getItem('user_role');
    let token = null;

    if (userRole === 'admin') {
      token = localStorage.getItem('admin_token');
    } else if (userRole === 'employee') {
      token = localStorage.getItem('employee_token');
    } else if (userRole === 'customer') {
      token = localStorage.getItem('auth_token');
    } else {
      // Fallback: try to find any token (for backward compatibility)
      token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('employee_token');
    }

    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }
}
