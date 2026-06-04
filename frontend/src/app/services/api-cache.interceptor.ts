import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { shareReplay, finalize } from 'rxjs/operators';

interface CachedResponse {
  response: HttpResponse<unknown>;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CachedResponse>();
const inFlight = new Map<string, Observable<HttpEvent<unknown>>>();

export function apiCacheInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (!isApiRequest(req)) {
    return next(req);
  }

  if (req.method !== 'GET') {
    clearApiCache();
    return next(req);
  }

  const key = req.urlWithParams;
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return of(cached.response.clone());
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const request$ = next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(key, {
          response: event.clone(),
          timestamp: Date.now(),
        });
      }
    }),
    finalize(() => inFlight.delete(key)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  inFlight.set(key, request$);
  return request$;
}

function isApiRequest(req: HttpRequest<unknown>): boolean {
  return req.url.startsWith('/api') || req.url.includes('/api/');
}

function clearApiCache(): void {
  cache.clear();
  inFlight.clear();
}