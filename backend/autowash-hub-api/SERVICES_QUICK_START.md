# Services Package Database - Quick Start Guide (5 Minutes)

**TL;DR:** 3 simple steps to get up and running.

## Step 1: Create Database (2 minutes)

### Option A: Via Browser (Easiest)
```
1. Visit: http://yoursite.com/api/setup_services_package.php
2. Wait for success message
✅ Done!
```

### Option B: Via phpMyAdmin
```
1. Open phpMyAdmin
2. Select your database
3. Click "SQL" tab
4. Copy-paste: create_services_package_tables.sql
5. Click "Go"
✅ Done!
```

### Option C: Via Command Line
```bash
mysql -u root -p yourdb < create_services_package_tables.sql
✅ Done!
```

## Step 2: Test the Database (1 minute)

Run this query:
```sql
SELECT * FROM pricing LIMIT 5;
```

You should see 5 pricing entries with vehicle types and service packages.

## Step 3: Test API Endpoints (2 minutes)

Visit these URLs in your browser:

```
http://yoursite.com/api/get_pricing_matrix
http://yoursite.com/api/get_service_packages
http://yoursite.com/api/get_service_vehicle_types
```

You should see JSON data returned.

---

## What You Got

✅ **4 Service Packages:**
- p1: Wash only
- p2: Wash / Vacuum
- p3: Wash / Vacuum / Hand Wax
- p4: Wash / Vacuum / Buffing Wax

✅ **4 Vehicle Types:**
- S: Sedans
- M: SUVs
- L: VANs
- XL: Larger vehicles

✅ **16 Pricing Entries:**
- All combinations pre-populated with default prices

---

## Files Created

| File | Purpose |
|------|---------|
| `create_services_package_tables.sql` | Database schema & seed data |
| `setup_services_package.php` | One-click setup script |
| `api/modules/services.php` | All API endpoints |
| `SERVICES_PACKAGE_SETUP.md` | Full documentation |
| `SERVICES_API_REFERENCE.md` | API endpoints reference |
| `SERVICES_PACKAGE_SUMMARY.md` | Complete overview |
| `SERVICES_IMPLEMENTATION_CHECKLIST.md` | Implementation guide |
| `SERVICES_ARCHITECTURE.md` | Diagrams & architecture |

---

## Common API Calls

```bash
# Get all pricing
curl http://yoursite.com/api/get_pricing_matrix

# Get specific price for Sedan + Wash only
curl http://yoursite.com/api/get_price?vehicle_type=S&service_package=p1

# Add new pricing entry
curl -X POST http://yoursite.com/api/add_pricing_entry \
  -H "Content-Type: application/json" \
  -d '{"vehicle_type_code":"S","service_package_code":"p1","price":150}'

# Update pricing
curl -X PUT http://yoursite.com/api/update_pricing_entry/1 \
  -H "Content-Type: application/json" \
  -d '{"price":160}'
```

---

## Frontend Usage

```typescript
// Inject the service
constructor(private http: HttpClient) {}

// Get pricing matrix
this.http.get('/api/get_pricing_matrix').subscribe(data => {
  console.log(data.payload); // { S: { p1: 140, ... }, ... }
})
```

---

## Verify Installation

Run these queries to confirm:

```sql
-- Should return 4
SELECT COUNT(*) FROM service_packages;

-- Should return 4
SELECT COUNT(*) FROM vehicle_types;

-- Should return 16
SELECT COUNT(*) FROM pricing;

-- Should show all pricing entries
SELECT * FROM pricing ORDER BY vehicle_type_code, service_package_code;
```

---

## Need Help?

📖 **Full documentation:** See [SERVICES_PACKAGE_SETUP.md](./SERVICES_PACKAGE_SETUP.md)
📚 **API reference:** See [SERVICES_API_REFERENCE.md](./SERVICES_API_REFERENCE.md)
✅ **Implementation checklist:** See [SERVICES_IMPLEMENTATION_CHECKLIST.md](./SERVICES_IMPLEMENTATION_CHECKLIST.md)
🏗️ **Architecture diagrams:** See [SERVICES_ARCHITECTURE.md](./SERVICES_ARCHITECTURE.md)

---

## Default Pricing Matrix

| Type | p1 | p2 | p3 | p4 |
|------|-----|-----|-----|-----|
| S | ₱140 | ₱260 | ₱270 | ₱360 |
| M | ₱160 | ₱300 | ₱310 | ₱420 |
| L | ₱180 | ₱370 | ₱390 | ₱520 |
| XL | ₱230 | ₱440 | ₱460 | ₱610 |

---

## That's It! 🎉

Your services package database is ready to use. Check the full documentation for advanced features like:
- Adding new service packages
- Adding new vehicle types
- Managing pricing through admin interface
- Integration with booking system
- Performance optimization

---

**Time to setup:** 5 minutes  
**Status:** ✅ Ready to use
