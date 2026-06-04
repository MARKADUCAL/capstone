import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, shareReplay, retryWhen, mergeMap } from 'rxjs/operators';

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
  private readonly MAX_RETRIES = 1;
  private readonly RETRY_DELAY = 1000; // 1 second base delay
  private lastRequestTime = 0;
  private requestQueue: Promise<void> = Promise.resolve();
  private readonly MIN_REQUEST_GAP = 1000;

  constructor(private http: HttpClient) {}

  /**
   * Get data from cache or make HTTP request with retry logic
   * @param url The API endpoint URL
   * @param forceRefresh Force a fresh API call even if cached
   */
  get<T>(url: string, forceRefresh: boolean = false): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(url);

    // Return cached data before making any HTTP request
    if (
      !forceRefresh &&
      cached &&
      now - cached.timestamp < this.CACHE_DURATION
    ) {
      return cached.data as Observable<T>;
    }

    // Make new request with queue + retry logic
    const request$ = new Observable<T>((subscriber) => {
      this.requestQueue = this.requestQueue.then(async () => {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.MIN_REQUEST_GAP) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.MIN_REQUEST_GAP - elapsed),
          );
        }
        this.lastRequestTime = Date.now();
      });

      this.requestQueue.then(() => {
        const sub = this.http.get<T>(url).subscribe(subscriber);
        subscriber.add(sub);
      });
    }).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            const shouldRetry =
              retryAttempt <= this.MAX_RETRIES &&
              error.status >= 500 &&
              error.status < 600;

            if (shouldRetry) {
              // Exponential backoff for transient server errors only.
              // Do not retry 429; retrying rate-limited requests creates more 429s.
              const delayTime = this.RETRY_DELAY * Math.pow(2, index);
              return timer(delayTime);
            }

            // Don't retry other errors
            return throwError(() => error);
          }),
        ),
      ),
      shareReplay(1), // Share the result among multiple subscribers
      catchError((error) => {
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
    } else {
      this.cache.clear();
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
