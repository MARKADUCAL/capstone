import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, of, throwError, timer } from 'rxjs';
import { catchError, map, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DestroyRef, inject } from '@angular/core';

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
export class NotificationService implements OnDestroy {
  unreadCount = new BehaviorSubject<number>(0);
  private pollingSubscription: ReturnType<typeof interval>['subscribe'] | null = null;
  private readonly POLLING_INTERVAL_MS = 60000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private http: HttpClient) {
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private isPollingActive = false;

  startPolling() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;

    timer(1500).pipe(switchMap(() => this.fetchUnreadCount())).subscribe();
    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS)
      .pipe(switchMap(() => this.fetchUnreadCount()))
      .subscribe({
        error: () => {
          // Don't let polling errors kill the subscription
        },
      });
  }

  stopPolling(resetCount: boolean = true) {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    this.isPollingActive = false;
    if (resetCount) {
      this.unreadCount.next(0);
    }
  }

  getNotifications(page = 1, perPage = 5) {
    return this.http
      .get<any>(`${environment.apiUrl}/notifications?page=${page}&per_page=${perPage}`, { headers: this.getHeaders() })
      .pipe(
        map((response) => response.payload || { notifications: [], unread_count: 0, total: 0, page, per_page: perPage, total_pages: 1 }),
        catchError((error) => {
          if (error.status === 429) {
            this.stopPolling();
          }
          return of({ notifications: [], unread_count: 0, total: 0, page, per_page: perPage, total_pages: 1 });
        })
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
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error, index) => {
              const retryAttempt = index + 1;
              const shouldRetry =
                retryAttempt <= this.MAX_RETRIES &&
                (error.status === 429 ||
                  (error.status >= 500 && error.status < 600));

              if (!shouldRetry) {
                return throwError(() => error);
              }

              return timer(this.RETRY_DELAY_MS * Math.pow(2, index));
            }),
          ),
        ),
        map((response) => {
          const count = response?.payload?.unread_count ?? 0;
          this.unreadCount.next(count);
          return count;
        }),
        catchError((error) => {
          console.error('Error fetching notification count:', error);
          return of(this.unreadCount.value);
        })
      );
  }

  private getHeaders(): HttpHeaders {
    const path = window.location.pathname;
    let token = null;

    if (path.startsWith('/admin')) {
      token = localStorage.getItem('admin_token');
    } else if (path.startsWith('/employee')) {
      token = localStorage.getItem('employee_token');
    } else if (path.startsWith('/customer')) {
      token = localStorage.getItem('auth_token');
    }

    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }
}
