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

export interface ReportSummaryServiceBreakdown {
  service_name: string;
  washes: number;
  revenue: number;
  percentage: number;
}

export interface ReportSummary {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_bookings: number;
  total_revenue: number;
  avg_per_wash: number;
  new_customers: number;
  returning_customers: number;
  service_breakdown: ReportSummaryServiceBreakdown[];
  daily_bookings: Array<{ day: string; bookings_count: number }>;
  weekly_bookings: number[];
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRevenueAnalytics(year?: number): Observable<RevenuePoint[]> {
    const url =
      year != null
        ? `${this.baseUrl}/get_revenue_analytics?year=${year}`
        : `${this.baseUrl}/get_revenue_analytics`;
    return this.http
      .get<any>(url)
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

  getWeeklyRevenueByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<
    Array<{
      week: number;
      startDate: string;
      endDate: string;
      revenue: number;
      bookings: number;
    }>
  > {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_weekly_revenue_range?start_date=${start}&end_date=${end}`
      )
      .pipe(map((res) => res?.payload?.weekly_revenue ?? []));
  }

  getReportSummary(
    startDate: Date,
    endDate: Date
  ): Observable<ReportSummary> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return this.http
      .get<any>(
        `${this.baseUrl}/get_report_summary?start_date=${start}&end_date=${end}`
      )
      .pipe(
        map(
          (res) =>
            res?.payload ?? {
              total_bookings: 0,
              completed_bookings: 0,
              cancelled_bookings: 0,
              no_show_bookings: 0,
              total_revenue: 0,
              avg_per_wash: 0,
              new_customers: 0,
              returning_customers: 0,
              service_breakdown: [],
              daily_bookings: [],
              weekly_bookings: [0, 0, 0, 0],
            }
        )
      );
  }
}
