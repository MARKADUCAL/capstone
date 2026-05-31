import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import {
  catchError,
  mergeMap,
  tap,
  delay,
} from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second base delay

  // Track in-flight requests to deduplicate concurrent calls
  private inFlight = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  /**
   * Get data from cache or make HTTP request with retry logic.
   * Caches RESOLVED VALUES, not Observable streams, so errors
   * are never replayed to future subscribers.
   * @param url The API endpoint URL
   * @param forceRefresh Force a fresh API call even if cached
   */
  get<T>(url: string, forceRefresh: boolean = false): Observable<T> {
    const now = Date.now();

    // Return cached DATA if valid and not forcing refresh
    if (!forceRefresh) {
      const cached = this.cache.get(url);
      if (cached && now - cached.timestamp < this.CACHE_DURATION) {
        return of(cached.data as T);
      }
    }

    // Check if there's already an in-flight request for this URL
    const existing = this.inFlight.get(url);
    if (existing && !forceRefresh) {
      return existing as Observable<T>;
    }

    // Make new request with retry logic
    const request$ = this.http.get<T>(url).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            const shouldRetry =
              retryAttempt <= this.MAX_RETRIES &&
              (error.status === 429 ||
                (error.status >= 500 && error.status < 600));

            if (shouldRetry) {
              // Exponential backoff: 1s, 2s, 4s
              const delayTime = this.RETRY_DELAY * Math.pow(2, index);
              return of(error).pipe(delay(delayTime));
            }

            // Don't retry other errors
            return throwError(() => error);
          }),
        ),
      ),
      tap((result) => {
        // Cache the RESOLVED VALUE, not the Observable
        this.cache.set(url, {
          data: result,
          timestamp: Date.now(),
        });
        // Remove from in-flight map
        this.inFlight.delete(url);
      }),
      catchError((error) => {
        // Remove from in-flight map on error too
        this.inFlight.delete(url);
        return throwError(() => error);
      }),
    );

    // Store in in-flight map for request deduplication
    this.inFlight.set(url, request$);

    return request$;
  }

  /**
   * Clear cache for a specific URL or all cache
   * @param url Optional URL to clear, if not provided clears all cache
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      this.inFlight.delete(url);
    } else {
      this.cache.clear();
      this.inFlight.clear();
    }
  }

  /**
   * Check if a URL is cached and valid
   * @param url The URL to check
   */
  isCached(url: string): boolean {
    const cached = this.cache.get(url);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.CACHE_DURATION;
  }
}
