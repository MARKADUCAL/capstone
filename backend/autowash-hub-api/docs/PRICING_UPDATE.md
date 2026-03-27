# Pricing System Update

## Overview

The backend has been updated to support a new pricing structure based on vehicle types and service packages, replacing the old service-based pricing system.

## Migration from Services to Pricing System

### What Changed

- **Removed**: Old `services` table and related API endpoints
- **Added**: New `pricing` table with vehicle type and service package combinations
- **Updated**: Booking system to use `service_package` instead of `service_id`

### Migration Steps

1. **Run the migration script**:

   ```bash
   php migrate_to_pricing.php
   ```

2. **Run the pricing setup script**:

   ```bash
   php setup_pricing.php
   ```

3. **Test the application** to ensure everything works correctly

4. **Optional**: After confirming everything works, you can drop the old services table:
   ```sql
   DROP TABLE services;
   ALTER TABLE bookings DROP COLUMN service_id;
   ```

## New Database Structure

### Pricing Table

```sql
CREATE TABLE pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(10) NOT NULL,
    service_package VARCHAR(10) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vehicle_service (vehicle_type, service_package)
);
```

### Updated Bookings Table

```sql
ALTER TABLE bookings ADD COLUMN service_package VARCHAR(10) AFTER vehicle_type;
```

### Vehicle Types

- **S** - Small Hatchbacks (e.g., wigo, picanto, eon)
- **M** - Small Hatchbacks | Sedan | Coupes (e.g., rio, accent, city, vios, civic)
- **L** - MPVs | AUVs | Compact SUVs (e.g., rav4, avanza, ecosport, cx3)
- **XL** - SUVs | Full SUVs | Pick-ups (e.g., trailblazer, hilux, ranger, fortuner)
- **XXL** - Modified Vehicles | Big SUVs (e.g., land cruiser, patrol, prado)

### Service Packages

- **1** - Body Wash
- **1.5** - Body Wash, Tire Black
- **2** - Body Wash, Tire Black, Vacuum
- **3** - Body Wash, Body Wax, Tire Black
- **4** - Body Wash, Body Wax, Tire Black, Vacuum

## API Endpoints

### Pricing Management

- `POST /create_pricing_table` - Create and initialize pricing table
- `GET /get_all_pricing` - Get all pricing entries
- `GET /get_pricing_matrix` - Get pricing in matrix format
- `POST /add_pricing_entry` - Add new pricing entry
- `PUT /update_pricing_entry` - Update pricing entry
- `PUT /toggle_pricing_status` - Toggle pricing entry status
- `GET /delete_pricing_entry?id={id}` - Delete pricing entry
- `GET /get_pricing?vehicle_type={type}&service_package={package}` - Get specific pricing

### Updated Booking

- `POST /create_booking` - Now uses vehicle_type and service_package instead of service_id

### Removed Endpoints

- `GET /services` - Removed (use pricing endpoints instead)
- `POST /services` - Removed (use pricing endpoints instead)
- `PUT /services` - Removed (use pricing endpoints instead)
- `DELETE /services/{id}` - Removed (use pricing endpoints instead)

## Default Pricing Matrix

| Vehicle Type | 1    | 1.5  | 2    | 3    | 4    |
| ------------ | ---- | ---- | ---- | ---- | ---- |
| S            | ₱140 | ₱170 | ₱260 | ₱270 | ₱360 |
| M            | ₱160 | ₱190 | ₱300 | ₱310 | ₱420 |
| L            | ₱180 | ₱230 | ₱370 | ₱390 | ₱520 |
| XL           | ₱230 | ₱290 | ₱440 | ₱460 | ₱610 |
| XXL          | ₱250 | ₱320 | ₱480 | ₱510 | ₱670 |

## Frontend Integration

The frontend has been updated to:

- Use vehicle types and service packages instead of services
- Calculate prices based on the pricing matrix
- Display pricing guide in the appointment form
- Manage pricing through the admin service management interface

## Migration Notes

- Old bookings with `service_id` will be migrated to use `service_package`
- New bookings will use `vehicle_type` and `service_package`
- The pricing is automatically calculated based on the selected combination
- Admin can manage pricing through the service management interface

## Troubleshooting

### Common Issues

1. **"Service not found" errors**: Make sure you've run the migration script
2. **Pricing not loading**: Ensure the pricing table has been created and populated
3. **Booking creation fails**: Check that vehicle_type and service_package are valid

### Rollback Plan

If you need to rollback:

1. Restore the services table from backup
2. Remove the service_package column from bookings
3. Restore the old API endpoints
4. Update frontend to use the old services system
