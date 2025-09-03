import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse {
  status: {
    remarks: string;
    message: string;
  };
  payload: {
    token: string;
    user: {
      stud_id_no?: string;
      faculty_id_no?: string;
      fname: string;
      lname: string;
      email: string;
      role: string;
      profile_picture?: string;
    };
  } | null;
  prepared_by: string;
  timestamp: string;
}

export interface User {
  id?: number;
  fname: string;
  lname: string;
  email: string;
  role: string;
  profile_picture?: string;
  stud_id_no?: string;
  faculty_id_no?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fname: string;
  lname: string;
  email: string;
  password: string;
  role: 'customer' | 'employee' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadStoredAuth();
  }

  // Load stored authentication data
  private loadStoredAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      const userStr = localStorage.getItem(this.userKey);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          this.clearStoredAuth();
        }
      }
    }
  }

  // Store authentication data
  private storeAuth(token: string, user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  // Clear stored authentication data
  private clearStoredAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  // Get current token
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Login
  login(credentials: LoginRequest): Observable<ApiResponse> {
    console.log('🔧 AuthService: login called');
    console.log('📤 Login data:', credentials);

    return this.http
      .post<ApiResponse>(`${this.apiUrl}/login_customer`, credentials)
      .pipe(
        tap((response) => {
          console.log('📥 Login response:', response);

          if (response.status.remarks === 'success' && response.payload) {
            const { token, user } = response.payload;
            this.storeAuth(token, user);
            this.currentUserSubject.next(user);
            console.log('✅ Login successful, user stored');
          }
        }),
        catchError((error) => {
          console.error('💥 Login error:', error);
          return throwError(
            () => new Error('Login failed. Please check your credentials.')
          );
        })
      );
  }

  // Register
  register(userData: RegisterRequest): Observable<ApiResponse> {
    console.log('🔧 AuthService: register called');
    console.log('📤 Register data:', userData);

    return this.http
      .post<ApiResponse>(`${this.apiUrl}/register_customer`, userData)
      .pipe(
        tap((response) => {
          console.log('📥 Register response:', response);

          if (response.status.remarks === 'success' && response.payload) {
            const { token, user } = response.payload;
            this.storeAuth(token, user);
            this.currentUserSubject.next(user);
            console.log('✅ Registration successful, user stored');
          }
        }),
        catchError((error) => {
          console.error('💥 Registration error:', error);
          return throwError(
            () => new Error('Registration failed. Please try again.')
          );
        })
      );
  }

  // Logout
  logout(): void {
    console.log('🔧 AuthService: logout called');
    this.clearStoredAuth();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    console.log('✅ Logout successful');
  }

  // Get HTTP headers with authorization
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is employee
  isEmployee(): boolean {
    return this.hasRole('employee');
  }

  // Check if user is customer
  isCustomer(): boolean {
    return this.hasRole('customer');
  }
}
