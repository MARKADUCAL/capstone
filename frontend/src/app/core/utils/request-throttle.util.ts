/**
 * Request Throttle Utility
 * Prevents duplicate/spam requests by tracking and debouncing identical requests
 * Usage: Wrap your HTTP calls with throttleRequest() to prevent duplicates
 */

import { Subject, Observable, throwError } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  finalize,
} from 'rxjs/operators';

interface RequestEntry {
  key: string;
  observable$: Observable<any>;
  timestamp: number;
}

/**
 * Global request cache to prevent concurrent duplicate requests
 * Maps request key -> Observable to prevent re-execution
 */
const requestCache = new Map<string, RequestEntry>();
const REQUEST_CACHE_TTL = 2000; // 2 seconds - how long to keep a request in cache

/**
 * Generates a unique key for a request based on method and data
 */
export function generateRequestKey(
  method: string,
  url: string,
  data?: any,
): string {
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${dataStr}`;
}

/**
 * Clears expired entries from the request cache
 */
function clearExpiredCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  requestCache.forEach((entry, key) => {
    if (now - entry.timestamp > REQUEST_CACHE_TTL) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach((key) => requestCache.delete(key));
}

/**
 * Wraps an observable to prevent duplicate concurrent requests
 * If the same request is already in flight, returns a shared observable
 * Usage:
 *   const request$ = this.http.post('/api/login', data);
 *   throttleRequest('login', request$).subscribe(...)
 */
export function throttleRequest<T>(
  requestKey: string,
  request$: Observable<T>,
): Observable<T> {
  // Clean up expired cache entries
  clearExpiredCache();

  // Check if request is already in flight
  const cached = requestCache.get(requestKey);
  if (cached && Date.now() - cached.timestamp < REQUEST_CACHE_TTL) {
    console.log(`📦 Returning cached/in-flight request for: ${requestKey}`);
    return cached.observable$ as Observable<T>;
  }

  // Create new observable and cache it
  const throttledRequest$ = request$.pipe(
    finalize(() => {
      // Remove from cache after request completes
      const entry = requestCache.get(requestKey);
      if (entry && Date.now() - entry.timestamp > REQUEST_CACHE_TTL) {
        requestCache.delete(requestKey);
      }
    }),
  );

  requestCache.set(requestKey, {
    key: requestKey,
    observable$: throttledRequest$,
    timestamp: Date.now(),
  });

  return throttledRequest$;
}

/**
 * Clears all cached requests
 * Useful when logging out or switching users
 */
export function clearRequestCache(): void {
  console.log('🧹 Clearing request cache');
  requestCache.clear();
}

/**
 * Subject-based debouncing for form submissions
 * Prevents multiple submissions within a specified time window
 */
export class SubmissionDebouncer<T> {
  private subject$ = new Subject<T>();
  private isProcessing = false;

  constructor(private debounceMs: number = 300) {
    this.subject$
      .pipe(
        debounceTime(debounceMs),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
        ),
      )
      .subscribe((value) => {
        if (!this.isProcessing) {
          this.isProcessing = false;
        }
      });
  }

  /**
   * Submit a value - will be debounced
   */
  submit(value: T): void {
    if (this.isProcessing) {
      console.log('⏳ Submission already in progress, ignoring duplicate');
      return;
    }
    this.isProcessing = true;
    this.subject$.next(value);
  }

  /**
   * Reset processing state
   */
  reset(): void {
    this.isProcessing = false;
  }

  /**
   * Get the debounced observable
   */
  getObservable(): Observable<T> {
    return this.subject$.asObservable();
  }
}
