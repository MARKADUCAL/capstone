import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import {
  catchError,
  shareReplay,
  tap,
  delay,
  retryWhen,
  mergeMap,
} from 'rxjs/operators';

interface CacheEntry {
  data: Observable<any>;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second base delay

  constructor(private http: HttpClient) {}

  /**
   * Get data from cache or make HTTP request with retry logic
   * @param url The API endpoint URL
   * @param forceRefresh Force a fresh API call even if cached
   */
  get<T>(url: string, forceRefresh: boolean = false): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(url);

    // Return cached data if valid and not forcing refresh
    if (
      !forceRefresh &&
      cached &&
      now - cached.timestamp < this.CACHE_DURATION
    ) {
      console.log(`[Cache] Using cached data for: ${url}`);
      return cached.data as Observable<T>;
    }

    // Make new request with retry logic
    console.log(`[Cache] Fetching fresh data for: ${url}`);
    const request$ = this.http.get<T>(url).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            const shouldRetry =
              retryAttempt <= this.MAX_RETRIES &&
              error.status >= 500 &&
              error.status < 600;

            if (shouldRetry) {
              // Exponential backoff: 1s, 2s, 4s
              const delayTime = this.RETRY_DELAY * Math.pow(2, index);
              console.log(
                `[Cache] Retry ${retryAttempt}/${this.MAX_RETRIES} for ${url} after ${delayTime}ms`,
              );

              return of(error).pipe(delay(delayTime));
            }

            // Don't retry other errors
            return throwError(() => error);
          }),
        ),
      ),
      shareReplay(1), // Share the result among multiple subscribers
      tap(() => console.log(`[Cache] Successfully fetched: ${url}`)),
      catchError((error) => {
        console.error(`[Cache] Failed to fetch ${url}:`, error);
        // Remove failed request from cache
        this.cache.delete(url);
        return throwError(() => error);
      }),
    );

    // Store in cache
    this.cache.set(url, {
      data: request$,
      timestamp: now,
    });

    return request$;
  }

  /**
   * Clear cache for a specific URL or all cache
   * @param url Optional URL to clear, if not provided clears all cache
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      console.log(`[Cache] Cleared cache for: ${url}`);
    } else {
      this.cache.clear();
      console.log('[Cache] Cleared all cache');
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
