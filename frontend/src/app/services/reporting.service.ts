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
}

export interface DashboardSummaryResponse {
  dashboard_summary: DashboardSummary;
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
}
