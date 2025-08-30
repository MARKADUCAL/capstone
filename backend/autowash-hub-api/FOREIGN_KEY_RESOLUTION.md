# Foreign Key Constraint Resolution Guide

## Problem

You're encountering this error when trying to drop the `services` table:

```
#1451 - Cannot delete or update a parent row: a foreign key constraint fails
```

This happens because the `bookings` table has a `service_id` column that references the `services` table through a foreign key constraint.

## Solution Steps

### Step 1: Run the Migration Script

First, ensure all your data is migrated to the new pricing system:

```bash
php migrate_to_pricing.php
```

This script will:

- Add the `service_package` column to the `bookings` table
- Create the new `pricing` table
- Migrate existing bookings from `service_id` to `service_package`
- Drop foreign key constraints
- Drop the `service_id` column

### Step 2: Run the Pricing Setup Script

Initialize the pricing table with default data:

```bash
php setup_pricing.php
```

### Step 3: Test Your Application

Verify that everything works correctly with the new pricing system before proceeding.

### Step 4: Run the Safe Cleanup Script

Once you're confident everything works, run the safe cleanup:

```bash
php safe_cleanup.php
```

This script will:

- Verify that no bookings still reference the old `service_id`
- Check that the new pricing system is properly set up
- Safely drop the `services` table

## Manual Resolution (if scripts don't work)

If the automated scripts don't work, you can manually resolve this:

### 1. Check Foreign Key Constraints

```sql
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME = 'services';
```

### 2. Drop Foreign Key Constraints

For each constraint found, drop it:

```sql
ALTER TABLE bookings DROP FOREIGN KEY `constraint_name`;
```

### 3. Drop the Column

```sql
ALTER TABLE bookings DROP COLUMN service_id;
```

### 4. Drop the Table

```sql
DROP TABLE services;
```

## Alternative: Disable Foreign Key Checks (Not Recommended)

⚠️ **Warning**: This method can lead to data integrity issues. Only use if you're absolutely sure about the data.

```sql
-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the table
DROP TABLE services;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
```

## Verification

After completing the migration, verify:

1. **Pricing table exists and has data:**

   ```sql
   SELECT COUNT(*) FROM pricing;
   ```

2. **Bookings table has service_package column:**

   ```sql
   DESCRIBE bookings;
   ```

3. **No service_id column remains:**

   ```sql
   SHOW COLUMNS FROM bookings LIKE 'service_id';
   ```

4. **Services table is gone:**
   ```sql
   SHOW TABLES LIKE 'services';
   ```

## Troubleshooting

### If migration fails:

1. Check database connection
2. Ensure you have proper permissions
3. Verify the database exists and is accessible

### If cleanup fails:

1. Run the migration script first
2. Check for any remaining foreign key constraints
3. Verify all data has been migrated

### If you get permission errors:

1. Ensure your database user has ALTER and DROP privileges
2. Check if you're connected to the correct database

## Support

If you continue to have issues:

1. Check the error logs for specific error messages
2. Verify your database schema matches the expected structure
3. Consider backing up your data before making changes
