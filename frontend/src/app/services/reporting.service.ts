import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RevenuePoint {
  month: string;
  revenue: number;
  bookings_count: number;
}

export interface RevenueAnalyticsResponse {
  revenue_data: RevenuePoint[];
}

export interface ServiceDistributionItem {
  service_name: string;
  booking_count: number;
  average_price: number;
  total_revenue: number;
}

export interface ServiceDistributionResponse {
  service_distribution: ServiceDistributionItem[];
}

export interface DashboardSummary {
  total_customers: number;
  total_employees: number;
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  monthly_revenue: number;
  weekly_revenue?: number;
  cancelled_bookings?: number;
  canceled_bookings?: number;
  declined_bookings?: number;
}

export interface DashboardSummaryResponse {
  dashboard_summary: DashboardSummary;
}

export interface WeeklyBookingPoint {
  day: string;
  bookings_count: number;
}

export interface WeeklyBookingsResponse {
  weekly_bookings: WeeklyBookingPoint[];
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRevenueAnalytics(): Observable<RevenuePoint[]> {
    return this.http
      .get<any>(`${this.baseUrl}/get_revenue_analytics`)
      .pipe(map((res) => res?.payload?.revenue_data ?? []));
  }

  getServiceDistribution(): Observable<ServiceDistributionItem[]> {
    return this.http
      .get<any>(`${this.baseUrl}/get_service_distribution`)
      .pipe(map((res) => res?.payload?.service_distribution ?? []));
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http
      .get<any>(`${this.baseUrl}/get_dashboard_summary`)
      .pipe(map((res) => res?.payload?.dashboard_summary ?? null));
  }

  getWeeklyBookings(): Observable<WeeklyBookingPoint[]> {
    return this.http
      .get<any>(`${this.baseUrl}/get_weekly_bookings`)
      .pipe(map((res) => res?.payload?.weekly_bookings ?? []));
  }

  getWeeklyBookingsByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<WeeklyBookingPoint[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_weekly_bookings_range?start_date=${start}&end_date=${end}`
      )
      .pipe(map((res) => res?.payload?.weekly_bookings ?? []));
  }

  getMonthlyBookingsByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<WeeklyBookingPoint[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_monthly_bookings_range?start_date=${start}&end_date=${end}`
      )
      .pipe(map((res) => res?.payload?.monthly_bookings ?? []));
  }

  getRevenueByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<{ total_revenue: number; completed_bookings: number }> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_revenue_by_date_range?start_date=${start}&end_date=${end}`
      )
      .pipe(
        map(
          (res) => res?.payload || { total_revenue: 0, completed_bookings: 0 }
        )
      );
  }

  getDailyRevenueByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<Array<{ day: number; revenue: number; bookings: number }>> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_daily_revenue_range?start_date=${start}&end_date=${end}`
      )
      .pipe(map((res) => res?.payload?.daily_revenue ?? []));
  }
}

