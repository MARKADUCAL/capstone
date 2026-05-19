# Quick Start: Performance Optimization Implementation

**Last Updated:** May 19, 2026

This guide provides step-by-step instructions to implement the performance optimizations identified in the audit.

---

## ⚡ Quick Wins (15 minutes)

### Step 1: Enable Lazy Loading Routes

**File to modify:** `frontend/src/app/app.config.ts`

```typescript
// BEFORE:
import { routes } from "./app.routes";

// AFTER:
import { routes } from "./app.routes.lazy";
```

**Expected Result:** 40% reduction in initial bundle size

---

### Step 2: Add Loading Skeleton to One Component (Test)

**Example: Admin Dashboard**

1. Open `frontend/src/app/components/admin/dashboard/dashboard.component.ts`

2. Add import:

```typescript
import { LoadingSkeletonComponent } from "../../../shared/components/loading-skeleton/loading-skeleton.component";
```

3. Add to imports array:

```typescript
@Component({
  imports: [
    CommonModule,
    LoadingSkeletonComponent, // Add this
    // ... other imports
  ],
})
```

4. Update template (dashboard.component.html):

```html
<!-- Add at the top of the template -->
<app-loading-skeleton *ngIf="loading" type="dashboard"></app-loading-skeleton>

<!-- Wrap existing content -->
<div *ngIf="!loading">
  <!-- existing dashboard content -->
</div>
```

**Test:** Refresh the dashboard - you should see skeleton loading animation

---

## 🚀 High Impact Changes (1-2 hours)

### Step 3: Add Caching to Admin Dashboard

**File:** `frontend/src/app/components/admin/dashboard/dashboard.component.ts`

1. Import ApiCacheService:

```typescript
import { ApiCacheService } from "../../../services/api-cache.service";
```

2. Inject in constructor:

```typescript
constructor(
  private http: HttpClient,
  private apiCache: ApiCacheService, // Add this
  // ... other services
) {}
```

3. Replace direct HTTP calls with cached calls:

**BEFORE:**

```typescript
loadDashboardSummary(): Promise<void> {
  return new Promise((resolve) => {
    this.http.get(`${this.apiUrl}/get_dashboard_summary`).subscribe({
      next: (response: any) => {
        // process response
      }
    });
  });
}
```

**AFTER:**

```typescript
loadDashboardSummary(): Promise<void> {
  return new Promise((resolve) => {
    this.apiCache.get(`${this.apiUrl}/get_dashboard_summary`).subscribe({
      next: (response: any) => {
        // process response
      }
    });
  });
}
```

**Repeat for:**

- `loadCustomerCount()`
- `loadBookingCount()`
- `loadCompletedBookingCount()`
- `loadPendingBookingCount()`

---

### Step 4: Add Caching to Employee Dashboard

**File:** `frontend/src/app/components/employee/dashboard/dashboard.component.ts`

Same process as Step 3:

1. Import and inject `ApiCacheService`
2. Replace HTTP calls in:
   - `loadBookingStats()` (3 calls)
   - `loadUpcomingTasks()`
   - `loadCustomerRating()`

---

### Step 5: Optimize Auto-Refresh

**File:** `frontend/src/app/components/employee/dashboard/dashboard.component.ts`

**Find (around line 119):**

```typescript
private readonly autoRefreshMs = 30_000;
```

**Replace with:**

```typescript
private readonly autoRefreshMs = 60_000; // Changed from 30s to 60s
```

**Find (around line 173):**

```typescript
this.autoRefreshSub = interval(this.autoRefreshMs).subscribe(() => {
  if (this.loading) return;
  this.loadBookingStats();
  this.loadUpcomingTasks();
  this.loadCustomerRating();
});
```

**Replace with:**

```typescript
this.autoRefreshSub = interval(this.autoRefreshMs).subscribe(() => {
  // Only refresh if tab is visible and not already loading
  if (this.loading || document.hidden) return;
  this.loadBookingStats();
  this.loadUpcomingTasks();
  this.loadCustomerRating();
});
```

---

## 📊 Component-by-Component Checklist

### Admin Components

- [ ] **Dashboard** - Add loading skeleton + caching
- [ ] **Car Wash Booking** - Add loading skeleton + pagination
- [ ] **User Management** - Add loading skeleton + caching
- [ ] **Employee Management** - Add loading skeleton + caching
- [ ] **Admin Management** - Add loading skeleton + caching
- [ ] **Service Management** - Add loading skeleton
- [ ] **Feedback Management** - Add loading skeleton + caching
- [ ] **Reporting** - Add loading skeleton + caching
- [ ] **Landing Editor** - Add loading skeleton
- [ ] **Manage Enquiries** - Add loading skeleton

### Employee Components

- [ ] **Dashboard** - Add loading skeleton + caching + optimize refresh
- [ ] **Car Wash Booking** - Add loading skeleton
- [ ] **Customer Records** - Add loading skeleton + caching + pagination
- [ ] **Profile** - Already has caching ✅

### Customer Components

- [ ] **Dashboard** - Already has caching ✅
- [ ] **Appointment** - Already has caching ✅
- [ ] **Profile** - Already has caching ✅
- [ ] **Transaction History** - Add loading skeleton + caching

---

## 🧪 Testing After Each Change

### Test Lazy Loading

```bash
# Build the app
cd frontend
npm run build

# Check bundle sizes in dist folder
# Main bundle should be ~40% smaller
```

### Test Loading Skeletons

1. Open browser DevTools
2. Go to Network tab
3. Throttle to "Slow 3G"
4. Navigate to component
5. Verify skeleton appears before data loads

### Test Caching

1. Open component (e.g., Admin Dashboard)
2. Note load time in Network tab
3. Navigate away and back
4. Second load should be instant (from cache)
5. Check console for cache logs

---

## 📈 Measuring Impact

### Before Optimization

```bash
# Run Lighthouse audit
npm run build
# Serve production build
npx http-server dist/frontend/browser -p 4200

# Open Chrome DevTools > Lighthouse
# Run audit on dashboard pages
```

**Expected baseline:**

- Performance Score: 60-70
- First Contentful Paint: 3-4s
- Time to Interactive: 4-6s

### After Optimization

**Expected improvements:**

- Performance Score: 85-95
- First Contentful Paint: 1.5-2s
- Time to Interactive: 2-3s

---

## 🐛 Troubleshooting

### Issue: Lazy loading breaks routing

**Solution:** Check that all component exports match the import statements in `app.routes.lazy.ts`

### Issue: Loading skeleton doesn't appear

**Solution:**

1. Verify `LoadingSkeletonComponent` is imported
2. Check that `loading` variable is set to `true` before API calls
3. Ensure `*ngIf="loading"` is in template

### Issue: Cache serves stale data

**Solution:**

```typescript
// Clear cache manually when needed
this.apiCache.clearCache("/api/specific-endpoint");

// Or clear all cache
this.apiCache.clearAllCache();
```

### Issue: TypeScript errors after adding ApiCacheService

**Solution:** Ensure proper import:

```typescript
import { ApiCacheService } from "../../../services/api-cache.service";
// Adjust path based on component location
```

---

## 🎯 Priority Order

**Week 1:**

1. ✅ Enable lazy loading (Step 1)
2. ✅ Add loading skeletons to dashboards (Step 2)
3. ✅ Add caching to admin dashboard (Step 3)
4. ✅ Add caching to employee dashboard (Step 4)
5. ✅ Optimize auto-refresh (Step 5)

**Week 2:** 6. Add loading skeletons to all remaining components 7. Add caching to user/employee management 8. Add caching to reporting components

**Week 3:** 9. Implement pagination on large lists 10. Optimize API payloads (backend changes needed)

---

## 📝 Notes

- **Cache TTL:** Currently set to 5 minutes in `ApiCacheService`
- **Auto-refresh:** Changed from 30s to 60s to reduce server load
- **Loading skeletons:** Use appropriate type for each component:
  - `dashboard` - for dashboard pages
  - `table` - for data tables
  - `list` - for list views
  - `card` - for card layouts
  - `text` - for text content

---

## 🔗 Related Files

- **Lazy Routes:** `frontend/src/app/app.routes.lazy.ts`
- **Loading Skeleton:** `frontend/src/app/shared/components/loading-skeleton/loading-skeleton.component.ts`
- **Cache Service:** `frontend/src/app/services/api-cache.service.ts`
- **Full Report:** `PERFORMANCE_OPTIMIZATION_REPORT.md`

---

**Need Help?** Refer to the detailed `PERFORMANCE_OPTIMIZATION_REPORT.md` for comprehensive analysis and recommendations.
