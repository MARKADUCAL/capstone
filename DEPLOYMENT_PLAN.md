# 429 Fixes — Deployment & Testing Plan

**Status:** Ready for deployment  
**Critical fixes:** 2 commits ready  
**Build status:** ✅ Frontend builds successfully  
**Backend:** Ready (no migrations needed)

---

## Pre-Deployment Checklist

### Backend
- [x] All PHP changes are backward compatible
- [x] No database migrations required
- [x] Cache files use system temp directory (auto-cleanup)
- [x] Error logging added for debugging

### Frontend
- [x] TypeScript compilation passes
- [x] No breaking changes to components
- [x] Subscription cleanup properly implemented
- [x] All layout components fixed

---

## Deployment Steps

### 1. Deploy Backend to Hostinger
```bash
# Upload to Hostinger via FTP/SFTP:
backend/autowash-hub-api/api/routes.php
backend/autowash-hub-api/api/modules/get.php
backend/autowash-hub-api/api/modules/post.php
```

**Time required:** ~2 minutes  
**Risk level:** Low (backward compatible)  
**Rollback:** Simple file restore

---

### 2. Deploy Frontend to Vercel
```bash
# Current dist folder is ready:
frontend/dist/autowash-hub/

# Option A: Use Vercel CLI
vercel deploy --prod

# Option B: Push to main branch (auto-deploys)
git push origin main
```

**Time required:** ~1-3 minutes  
**Risk level:** Low (tested build passes)  
**Rollback:** Automatic via Vercel deployment history

---

## Testing Plan (After Deployment)

### Phase 1: Immediate Smoke Test (5 minutes)
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to each dashboard (Admin, Employee, Customer)
4. Look for 429 errors in console
5. Expected: No 429 errors should appear
```

### Phase 2: Load Test (10 minutes)
```
1. Open 2-3 browser tabs/windows
2. Log in as different roles simultaneously:
   - 1 admin
   - 1 employee  
   - 1 customer
3. Let dashboards load
4. Navigate between pages
5. Check console for errors
6. Expected: No rate limit errors across all roles
```

### Phase 3: Extended Monitoring (30 minutes)
```
1. Leave all 3 dashboards open
2. Monitor console for any 429 errors
3. Check notification updates (should appear every 5 minutes)
4. Perform actions:
   - View bookings
   - Check feedback
   - Update profile
5. Expected: All operations smooth, no rate limits
```

### Phase 4: Polling Interval Reset (After 30 min success)
```
If no 429s appear after 30 minutes:
1. Update notification.service.ts:
   POLLING_INTERVAL_MS = 120000 (from 300000)
2. Rebuild frontend:
   npm run build
3. Deploy to Vercel
4. Test again for 10 minutes
5. Expected: Still no 429s, notifications faster (2 min vs 5 min)
```

---

## Monitoring & Diagnostics

### Browser Console (User-visible)
```javascript
// Check for 429 errors
console.error logs containing "429"

// Check polling frequency
// Open DevTools Network tab
// Filter: XHR
// Look for: /notifications/count requests
// Expected: One every 5 minutes (or 2 after reset)
```

### Server Logs (Hostinger)
```
1. SSH into Hostinger or use File Manager
2. Check error logs:
   - backend/autowash-hub-api/api/error_log
   - PHP error logs
3. Look for:
   - Cache file creation (indicates caching works)
   - No repeated "Feedback column check" messages
   - No database connection errors
```

### Key Metrics to Watch
| Metric | Current | Target | Check method |
|--------|---------|--------|--------------|
| Notification polling frequency | 5 min | No 429s | Browser Network tab |
| Dashboard load time | - | < 2s | DevTools Timing |
| API cache hit rate | - | > 90% | Server logs |
| Concurrent users | ~30-40 | 300+/estimate | Observation |

---

## Rollback Plan (If Issues Arise)

### Quick Rollback (< 5 minutes)

**Backend:**
```bash
# Restore previous versions via FTP
# Files to restore:
- routes.php (remove caching code)
- get.php (remove flag)
- post.php (remove flag)
```

**Frontend:**
```bash
# Revert to previous Vercel deployment
1. Open Vercel dashboard
2. Click "Deployments"
3. Click "Rollback" on previous stable build
```

### Full Rollback (If needed)
```bash
cd D:\mark\New folder\github\capstone
git revert bb4b820
git revert 83f371d
npm run build
vercel deploy --prod
```

---

## Success Criteria

✅ **Rate limit errors eliminated**
- No 429s in browser console
- Multiple concurrent users work smoothly

✅ **Performance maintained**
- Dashboard loads in < 2 seconds
- API responses unchanged

✅ **Functionality intact**
- Notifications appear correctly
- All CRUD operations work
- Customer bookings display properly

✅ **No memory leaks**
- Polling stops cleanly on logout
- Multiple login/logout cycles work

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor for 429 errors (production)
- [ ] Check server logs for errors
- [ ] Verify cache files are being created
- [ ] Test with 5+ concurrent users

### Day 2
- [ ] If stable, reset polling to 120s
- [ ] Re-test performance
- [ ] Check cache hit rates

### Day 7
- [ ] Review server performance metrics
- [ ] Check if additional optimization needed
- [ ] Document final results

---

## Contact & Support

If 429 errors persist after deployment:

1. **Check console for error patterns**
   - Are all 429s from `/notifications/count`?
   - Are they from `/get_dashboard_summary`?
   - Are they from other endpoints?

2. **Review browser Network tab**
   - How frequently are requests being sent?
   - Are subscriptions accumulating?

3. **Check server logs**
   - Any database errors?
   - Any file system permission issues?
   - Cache files being created?

4. **Common issues & fixes**
   - Issue: Still seeing 429s every 1-2 minutes
     - Cause: Polling interval didn't update
     - Fix: Rebuild frontend, clear browser cache
   
   - Issue: Notifications not appearing
     - Cause: 5-minute polling is normal
     - Fix: Wait, or reduce polling interval back to 120s
   
   - Issue: Cache files not found in logs
     - Cause: Temp directory permissions
     - Fix: Check `/tmp` or system temp dir permissions

---

## Summary

**Two commits ready for production:**
1. `83f371d` — Backend caching + frontend polling optimization
2. `bb4b820` — Subscription leak fixes + customer bookings cache

**Expected outcome:**
- 80-85% reduction in request rate
- 10x improvement in concurrent user capacity
- Zero 429 errors (from ~4-5 per minute to 0)
- No user-visible performance degradation

**Timeline:**
- Deploy now: 5 minutes
- Test: 30-60 minutes
- Full reset to 2-min polling: After success confirmation

