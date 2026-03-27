# Services Package Database - Architecture Diagram

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVICES PACKAGE DATABASE                           │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────┐
                          │ SERVICE_PACKAGES │
                          └──────────────────┘
                                  │
                                  │ (1)
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    │             │             │
                 (many)        (many)       (many)
                    │             │             │
                    ▼             ▼             ▼
                   p1            p2            p3
                (Wash)      (Wash/Vac)   (Wash/Vac/Wax)
                    │             │             │
                    │             │             │
                    │    ┌────────┼────────┐    │
                    │    │                 │    │
                    └────┼────── PRICING ──┼────┘
                         │                 │
                         └────────────────┘
                              (many)
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
                 (1)           (1)           (1)
                    │            │            │
                    └────────────┼────────────┘
                                 │
                          ┌──────────────────┐
                          │  VEHICLE_TYPES   │
                          └──────────────────┘


KEY RELATIONSHIPS (Foreign Keys):
- pricing.vehicle_type_code → vehicle_types.code
- pricing.service_package_code → service_packages.code
```

## Entity-Relationship Diagram (ERD)

```
┌──────────────────────────────────────┐
│        SERVICE_PACKAGES              │
├──────────────────────────────────────┤
│ PK │ id                  (INT)        │
│    │ code                (VARCHAR10)  │◄─┐
│    │ description         (VARCHAR255) │  │
│    │ is_active           (TINYINT)    │  │
│    │ created_at          (TIMESTAMP)  │  │
│    │ updated_at          (TIMESTAMP)  │  
└──────────────────────────────────────┘  │
                                           │
                                           │ FK
                                           │
┌──────────────────────────────────────────────────────────────────┐
│                         PRICING                                  │
├──────────────────────────────────────────────────────────────────┤
│ PK │ id                         (INT)       │
│    │ vehicle_type_code          (VARCHAR10) │◄───────┐
│    │ service_package_code       (VARCHAR10) │        │
│    │ price                      (DECIMAL)   │   FK   │
│    │ is_active                  (TINYINT)   │        │ FK
│    │ created_at                 (TIMESTAMP) │        │
│    │ updated_at                 (TIMESTAMP) │        │
│ UQ │ (vehicle_type_code +                   │        │
│    │  service_package_code)                 │        │
└──────────────────────────────────────────────────────────────────┘
                                           │
                                           │
                                           │ FK
                                           │
┌──────────────────────────────────────┐  │
│      VEHICLE_TYPES                   │  │
├──────────────────────────────────────┤  │
│ PK │ id                  (INT)        │  │
│    │ code                (VARCHAR10)  │◄─┘
│    │ description         (VARCHAR255) │
│    │ is_active           (TINYINT)    │
│    │ created_at          (TIMESTAMP)  │
│    │ updated_at          (TIMESTAMP)  │
└──────────────────────────────────────┘
```

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular)                       │
├────────────────────────────────────────────────────────────────┤
│ • Service Packages Component                                    │
│ • Vehicle Types Component                                       │
│ • Pricing Display Component                                     │
│ • Admin Service Management                                      │
└────────────────────────────────────────────────────────────────┘
              │                      │                      │
              │ HTTP GET/POST        │ HTTP PUT/DELETE      │
              │                      │                      │
              ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS (PHP)                          │
├────────────────────────────────────────────────────────────────┤
│ /api/get_service_packages              [GET]                   │
│ /api/add_service_package               [POST]                  │
│ /api/update_service_package/{id}       [PUT]                   │
│ /api/delete_service_package/{id}       [DELETE]                │
│                                                                  │
│ /api/get_service_vehicle_types         [GET]                   │
│ /api/add_vehicle_type                  [POST]                  │
│ /api/update_vehicle_type/{id}          [PUT]                   │
│ /api/delete_vehicle_type/{id}          [DELETE]                │
│                                                                  │
│ /api/get_all_pricing                   [GET]                   │
│ /api/get_pricing_matrix                [GET]                   │
│ /api/get_price                         [GET]                   │
│ /api/add_pricing_entry                 [POST]                  │
│ /api/update_pricing_entry/{id}         [PUT]                   │
│ /api/delete_pricing_entry/{id}         [DELETE]                │
│ /api/toggle_pricing_status/{id}        [PUT]                   │
└────────────────────────────────────────────────────────────────┘
              │                      │                      │
              │ PDO/MySQL Query      │                      │
              │                      │                      │
              ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                             │
├────────────────────────────────────────────────────────────────┤
│ • service_packages (4 rows)                                     │
│ • vehicle_types (4 rows)                                        │
│ • pricing (16 rows)                                             │
└────────────────────────────────────────────────────────────────┘
```

## Pricing Matrix Structure

```
┌──────────────────────────────────────────────────────────────┐
│                  PRICING MATRIX STRUCTURE                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  JSON Output Format:                                          │
│  {                                                            │
│    "S": {                   ← Vehicle Type                    │
│      "p1": 140.00,          ← Service Package: Price          │
│      "p2": 260.00,                                            │
│      "p3": 270.00,                                            │
│      "p4": 360.00                                             │
│    },                                                         │
│    "M": {                                                     │
│      "p1": 160.00,                                            │
│      "p2": 300.00,                                            │
│      "p3": 310.00,                                            │
│      "p4": 420.00                                             │
│    },                                                         │
│    "L": {                                                     │
│      "p1": 180.00,                                            │
│      "p2": 370.00,                                            │
│      "p3": 390.00,                                            │
│      "p4": 520.00                                             │
│    },                                                         │
│    "XL": {                                                    │
│      "p1": 230.00,                                            │
│      "p2": 440.00,                                            │
│      "p3": 460.00,                                            │
│      "p4": 610.00                                             │
│    }                                                          │
│  }                                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Table Structure Comparison

```
┌──────────────────────────────────────┬──────────────────────────┐
│      SERVICE_PACKAGES TABLE          │   VEHICLE_TYPES TABLE    │
├──────────┬──────────┬────────────────┼──────────┬──────────┬────┤
│ id (PK)  │ code (U) │ description    │ id (PK)  │ code (U) │ ... │
├──────────┼──────────┼────────────────┼──────────┼──────────┼────┤
│ 1        │ p1       │ Wash only      │ 1        │ S        │ ... │
│ 2        │ p2       │ Wash/Vacuum    │ 2        │ M        │ ... │
│ 3        │ p3       │ Wash/Vac/Wax   │ 3        │ L        │ ... │
│ 4        │ p4       │ Wash/Vac/Buff  │ 4        │ XL       │ ... │
└──────────┴──────────┴────────────────┴──────────┴──────────┴────┘

┌──────────────────────────────────────────────────────────────┐
│                    PRICING TABLE                             │
├──────┬──────────────────┬─────────────────────┬───────┬─────┤
│ id   │ vehicle_type_cod │ service_package_cod │ price │ ... │
├──────┼──────────────────┼─────────────────────┼───────┼─────┤
│ 1    │ S                │ p1                  │ 140   │ ... │
│ 2    │ S                │ p2                  │ 260   │ ... │
│ 3    │ S                │ p3                  │ 270   │ ... │
│ 4    │ S                │ p4                  │ 360   │ ... │
│ 5    │ M                │ p1                  │ 160   │ ... │
│ ...  │ ...              │ ...                 │ ...   │ ... │
│ 16   │ XL               │ p4                  │ 610   │ ... │
└──────┴──────────────────┴─────────────────────┴───────┴─────┘

Legend:
  PK = Primary Key
  U  = Unique Constraint
  FK = Foreign Key
```

## API Call Sequence Diagram

```
Frontend              API Module            Database
   │                     │                      │
   │ GET /pricing_matrix │                      │
   ├────────────────────►│                      │
   │                     │ SELECT * FROM pricing│
   │                     ├─────────────────────►│
   │                     │                      │
   │                     │ Return 16 rows       │
   │                     │◄─────────────────────┤
   │                     │                      │
   │                     │ Build matrix JSON    │
   │                     │                      │
   │ JSON Matrix         │                      │
   │◄────────────────────┤                      │
   │                     │                      │
   ├─────────────────────┬─────────────────────────────────────┤
   │ Display             │                                     │
   │ Results             │                                     │
   │                     │                                     │
```

## Installation Flow

```
START
   │
   ▼
[Download/Copy Files]
   │
   ├─► create_services_package_tables.sql
   ├─► setup_services_package.php
   ├─► api/modules/services.php
   └─► Documentation files
   │
   ▼
[Create Database Tables]
   │
   ├─ Option A: Run setup_services_package.php
   ├─ Option B: Execute SQL script
   └─ Option C: Command line MySQL
   │
   ▼
[Verify Tables Created]
   │
   ├─► SELECT COUNT(*) FROM service_packages;
   ├─► SELECT COUNT(*) FROM vehicle_types;
   └─► SELECT COUNT(*) FROM pricing;
   │
   ▼
[Integrate API Module]
   │
   ├─► Copy services.php to api/modules/
   └─► Add routes to routes.php
   │
   ▼
[Test API Endpoints]
   │
   ├─► GET /api/get_service_packages
   ├─► GET /api/get_service_vehicle_types
   ├─► GET /api/get_pricing_matrix
   └─► Other CRUD endpoints
   │
   ▼
[Update Frontend]
   │
   ├─► Create PricingService
   ├─► Update components
   └─► Wire up endpoints
   │
   ▼
[Test Full Workflow]
   │
   ├─► Create booking
   ├─► Verify pricing
   └─► Admin operations
   │
   ▼
[Deploy to Production]
   │
   ▼
END - COMPLETE
```

## Database Index Strategy

```
┌──────────────────────────────────────────────────┐
│         INDEXES FOR PERFORMANCE                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ service_packages:                                │
│   PRIMARY KEY: id                                │
│   UNIQUE KEY: code                               │
│   ➜ Fast lookup by code (e.g., 'p1')             │
│                                                  │
│ vehicle_types:                                   │
│   PRIMARY KEY: id                                │
│   UNIQUE KEY: code                               │
│   ➜ Fast lookup by code (e.g., 'S')              │
│                                                  │
│ pricing:                                         │
│   PRIMARY KEY: id                                │
│   UNIQUE KEY: (vehicle_type_code,                │
│                service_package_code)             │
│   INDEX: vehicle_type_code                       │
│   INDEX: service_package_code                    │
│   FOREIGN KEY: vehicle_type_code                 │
│   FOREIGN KEY: service_package_code              │
│   ➜ Fast SELECT by combination                   │
│   ➜ Fast JOIN operations                         │
│   ➜ Integrity enforcement                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## File Organization

```
Backend Directory Structure
──────────────────────────────────────────────

autowash-hub-api/
├── api/
│   ├── modules/
│   │   ├── services.php             ← NEW
│   │   ├── get.php
│   │   ├── post.php
│   │   ├── put.php
│   │   └── upload.php
│   ├── routes.php                   ← MODIFIED
│   └── index.php                    ← MODIFIED
├── config/
│   ├── database.php
│   └── env.php
├── create_services_package_tables.sql   ← NEW
├── setup_services_package.php           ← NEW
│
├── SERVICES_PACKAGE_SETUP.md            ← NEW
├── SERVICES_API_REFERENCE.md            ← NEW
├── SERVICES_PACKAGE_SUMMARY.md          ← NEW
├── SERVICES_IMPLEMENTATION_CHECKLIST.md ← NEW
│
├── PRICING_UPDATE.md
├── API_DOCUMENTATION.md
└── ...
```

---

**Last Updated:** February 26, 2026
**Version:** 1.0
