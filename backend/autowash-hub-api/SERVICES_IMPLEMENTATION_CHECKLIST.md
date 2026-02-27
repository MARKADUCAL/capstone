# Services Package Database - Implementation Checklist

Use this checklist to ensure proper implementation of the services package database system.

## Phase 1: Database Setup ✅ Ready to Start

- [ ] **Download Files**
  - [ ] Copy `create_services_package_tables.sql` to your backend directory
  - [ ] Copy `setup_services_package.php` to your api directory
  - [ ] Review all documentation files

- [ ] **Create Database Tables**
  - [ ] Run `setup_services_package.php` via browser: `http://yoursite.com/api/setup_services_package.php`
  - [ ] **OR** Run SQL script via phpMyAdmin
  - [ ] **OR** Run via command line: `mysql -u root -p database < create_services_package_tables.sql`
  - [ ] Check response for success message

- [ ] **Verify Tables Created**
  - [ ] Open phpMyAdmin and check database
  - [ ] Confirm tables exist: `service_packages`, `vehicle_types`, `pricing`
  - [ ] Verify records in each table:
    - [ ] service_packages: 4 records (p1, p2, p3, p4)
    - [ ] vehicle_types: 4 records (S, M, L, XL)
    - [ ] pricing: 16 records (all combinations)

- [ ] **Test Data Verification**
  - [ ] Run: `SELECT * FROM pricing ORDER BY vehicle_type_code, service_package_code;`
  - [ ] Verify pricing matrix shows all expected combinations
  - [ ] Check sample prices match the documentation

## Phase 2: API Integration ⏳ In Progress

- [ ] **Copy API Module**
  - [ ] Copy `api/modules/services.php` to your backend/api/modules directory
  - [ ] Verify file permissions are correct

- [ ] **Integrate with Routes**
  - [ ] Update `api/routes.php` or `api/index.php` to include services endpoints
  - [ ] Add mappings for all service package endpoints
  - [ ] Add mappings for all vehicle type endpoints
  - [ ] Add mappings for all pricing endpoints
  - [ ] Test that routes are accessible

- [ ] **Test API Endpoints**
  - [ ] Test `GET /api/get_service_packages` - should return 4 packages
  - [ ] Test `GET /api/get_service_vehicle_types` - should return 4 vehicle types
  - [ ] Test `GET /api/get_pricing_matrix` - should return pricing structure
  - [ ] Test `GET /api/get_price?vehicle_type=S&service_package=p1` - should return ₱140
  - [ ] Test other endpoints using cURL or Postman

## Phase 3: Frontend Integration ⏳ Pending

- [ ] **Update Service**
  - [ ] Create/update `PricingService` in frontend
  - [ ] Add methods:
    - [ ] `getPricingMatrix()`
    - [ ] `getServicePackages()`
    - [ ] `getVehicleTypes()`
    - [ ] `getPrice(vehicleType, servicePackage)`

- [ ] **Update Components**
  - [ ] Update booking component to fetch vehicle types
  - [ ] Update booking component to fetch service packages
  - [ ] Update pricing display component with new data structure
  - [ ] Update pricing matrix display in pricing component
  - [ ] Test price calculation

- [ ] **Admin Interface (if applicable)**
  - [ ] Update service management component to fetch from new endpoints
  - [ ] Implement add/edit pricing functionality
  - [ ] Implement pricing matrix display
  - [ ] Add form validation
  - [ ] Test CRUD operations

## Phase 4: Testing & Validation ⏳ Pending

- [ ] **Functional Testing**
  - [ ] Create a test booking with each service package
  - [ ] Verify correct prices are calculated for each combination
  - [ ] Test updating prices through admin interface
  - [ ] Test adding new service packages
  - [ ] Test adding new vehicle types
  - [ ] Test deactivating/activating packages and types

- [ ] **Edge Cases**
  - [ ] Test with invalid vehicle type - should return error
  - [ ] Test with invalid service package - should return error
  - [ ] Test with missing parameters - should return 400 error
  - [ ] Test with invalid pricing ID - should return 404 error

- [ ] **Performance**
  - [ ] Check pricing matrix loads quickly
  - [ ] Monitor database query performance
  - [ ] Test with large pricing datasets (if applicable)

- [ ] **Browser Compatibility**
  - [ ] Test in Chrome
  - [ ] Test in Firefox
  - [ ] Test in Safari
  - [ ] Test in Edge
  - [ ] Test on mobile browsers

## Phase 5: Documentation & Handoff ⏳ Pending

- [ ] **Documentation**
  - [ ] Review and finalize [SERVICES_PACKAGE_SETUP.md](./SERVICES_PACKAGE_SETUP.md)
  - [ ] Review and finalize [SERVICES_API_REFERENCE.md](./SERVICES_API_REFERENCE.md)
  - [ ] Create internal developer guide if needed
  - [ ] Document any custom modifications made

- [ ] **Backup & Recovery**
  - [ ] Create database backup before launch
  - [ ] Document backup procedure
  - [ ] Test restore procedure

- [ ] **Deployment**
  - [ ] Copy all files to production
  - [ ] Run setup script on production database
  - [ ] Verify all endpoints work on production
  - [ ] Test full user workflow on production

## Phase 6: Monitoring & Maintenance ⏳ Pending

- [ ] **Set Up Monitoring**
  - [ ] Monitor API response times
  - [ ] Monitor database query performance
  - [ ] Set up error logging for API
  - [ ] Monitor pricing accuracy

- [ ] **Maintenance Plan**
  - [ ] Schedule regular database backups
  - [ ] Plan pricing review schedule
  - [ ] Document procedures for adding new vehicle types
  - [ ] Document procedures for adding new service packages
  - [ ] Plan user communication for any changes

---

## Detailed Setup Instructions

### Step 1: Database Setup (15 minutes)

1. Access your server via phpMyAdmin or command line
2. Select your database
3. Run the SQL script or PHP setup file
4. Verify tables exist and have correct data

```bash
# Verification queries
mysql -u root -p yourdb
SELECT COUNT(*) FROM service_packages;
SELECT COUNT(*) FROM vehicle_types;
SELECT COUNT(*) FROM pricing;
```

Expected output:
```
4
4
16
```

### Step 2: API Module Integration (30 minutes)

1. Copy `services.php` to `api/modules/`
2. Update your API router to include services endpoints

Example routes.php addition:
```php
require_once 'modules/services.php';

$servicesAPI = new ServicesPackageAPI($pdo, DB_NAME);

// Route handling
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch($endpoint) {
        case 'get_service_packages':
            echo json_encode($servicesAPI->get_service_packages());
            break;
        case 'get_service_vehicle_types':
            echo json_encode($servicesAPI->get_service_vehicle_types());
            break;
        case 'get_pricing_matrix':
            echo json_encode($servicesAPI->get_pricing_matrix());
            break;
        case 'get_price':
            echo json_encode($servicesAPI->get_price());
            break;
        // ... add more routes
    }
}
```

### Step 3: Frontend Integration (1-2 hours)

1. Create/update PricingService
2. Update booking component to use new endpoints
3. Update admin interface for pricing management
4. Test all user workflows

### Step 4: Testing (1-2 hours)

Use Postman or similar tool to test:
```
GET http://yoursite.com/api/get_pricing_matrix
GET http://yoursite.com/api/get_price?vehicle_type=S&service_package=p1
POST http://yoursite.com/api/add_pricing_entry
PUT http://yoursite.com/api/update_pricing_entry/1
```

---

## File Structure After Completion

```
backend/autowash-hub-api/
├── api/
│   ├── modules/
│   │   ├── services.php                [NEW]
│   │   ├── get.php
│   │   ├── post.php
│   │   ├── put.php
│   │   └── ...
│   ├── routes.php                      [MODIFIED - add routes]
│   └── index.php                       [MODIFIED - add routes]
├── config/
│   └── database.php
├── create_services_package_tables.sql  [NEW]
├── setup_services_package.php          [NEW]
├── SERVICES_PACKAGE_SETUP.md           [NEW]
├── SERVICES_API_REFERENCE.md           [NEW]
├── SERVICES_PACKAGE_SUMMARY.md         [NEW]
└── ...

frontend/src/
└── app/
    └── services/
        └── pricing.service.ts          [NEW/MODIFIED]
```

---

## Troubleshooting Guide

### Tables Not Found
- Verify setup script ran successfully
- Check database permissions
- Run verification queries above

### API Endpoints Return 404
- Verify routes.php includes services endpoints
- Check URL spelling and format
- Verify services.php file exists and is readable

### Pricing Not Showing
- Check tables have data: `SELECT COUNT(*) FROM pricing;`
- Verify API endpoint returns JSON
- Check browser console for errors
- Verify CORS headers if cross-domain

### Database Connection Error
- Verify credentials in config/database.php
- Test database connection separately
- Check database user permissions

---

## Success Criteria

✅ All tables created and populated  
✅ All API endpoints respond with correct data  
✅ Frontend displays pricing correctly  
✅ Vehicle types and packages manageable through admin  
✅ Bookings use new pricing structure  
✅ All tests pass  
✅ Documentation is complete  

---

## Support Resources

- [SERVICES_PACKAGE_SETUP.md](./SERVICES_PACKAGE_SETUP.md) - Full documentation
- [SERVICES_API_REFERENCE.md](./SERVICES_API_REFERENCE.md) - API reference
- [SERVICES_PACKAGE_SUMMARY.md](./SERVICES_PACKAGE_SUMMARY.md) - Quick summary
- [PRICING_UPDATE.md](./PRICING_UPDATE.md) - Existing pricing documentation

---

**Total Estimated Time:** 3-4 hours  
**Difficulty Level:** Medium  
**Prerequisites:** MySQL access, PHP knowledge, Angular experience

---

**Checklist Version:** 1.0  
**Last Updated:** February 26, 2026
