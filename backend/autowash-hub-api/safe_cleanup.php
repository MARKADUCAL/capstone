<?php
// Safe cleanup script to remove old services table and service_id column
// This script handles foreign key constraints properly
require_once "./api/config/database.php";

// Create database connection
$connection = new Connection();
$pdo = $connection->connect();

echo "Starting safe cleanup of old services system...\n";

try {
    // 1. First, check if we have any bookings that still reference services
    echo "1. Checking for bookings that still reference services...\n";
    try {
        $sql = "SELECT COUNT(*) as count FROM bookings WHERE service_id IS NOT NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            echo "⚠️  Found " . $result['count'] . " bookings that still have service_id references\n";
            echo "   These need to be migrated to service_package before cleanup\n";
            echo "   Please run migrate_to_pricing.php first to migrate these bookings\n";
            echo "   Then run this cleanup script again\n";
            exit(1);
        } else {
            echo "✅ No bookings found with service_id references\n";
        }
    } catch (\PDOException $e) {
        if (strpos($e->getMessage(), "Unknown column 'service_id'") !== false) {
            echo "✅ service_id column has already been dropped (migration completed)\n";
        } else {
            throw $e;
        }
    }

    // 2. Check if service_package column exists and has data
    echo "2. Verifying service_package column exists...\n";
    $sql = "SELECT COUNT(*) as count FROM bookings WHERE service_package IS NOT NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        echo "⚠️  No bookings found with service_package data\n";
        echo "   This suggests the migration may not have been completed\n";
        echo "   Please run migrate_to_pricing.php first\n";
        exit(1);
    } else {
        echo "✅ Found " . $result['count'] . " bookings with service_package data\n";
    }

    // 3. Check if pricing table exists and has data
    echo "3. Verifying pricing table exists...\n";
    $sql = "SELECT COUNT(*) as count FROM pricing";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetch();
    
    if ($result['count'] == 0) {
        echo "⚠️  Pricing table is empty or doesn't exist\n";
        echo "   Please run setup_pricing.php first to initialize pricing data\n";
        exit(1);
    } else {
        echo "✅ Pricing table has " . $result['count'] . " entries\n";
    }

    // 4. Drop the foreign key constraint first (if it exists)
    echo "4. Dropping foreign key constraints...\n";
    try {
        // Get the constraint name
        $sql = "SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'bookings' 
                AND COLUMN_NAME = 'service_id' 
                AND REFERENCED_TABLE_NAME = 'services'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $constraint = $stmt->fetch();
        
        if ($constraint) {
            $constraintName = $constraint['CONSTRAINT_NAME'];
            $pdo->exec("ALTER TABLE bookings DROP FOREIGN KEY `$constraintName`");
            echo "✅ Dropped foreign key constraint: $constraintName\n";
        } else {
            echo "✅ No foreign key constraint found (already dropped or never existed)\n";
        }
    } catch (\PDOException $e) {
        echo "✅ Foreign key constraints already handled (column may have been dropped)\n";
    }

    // 5. Drop the service_id column from bookings table
    echo "5. Dropping service_id column from bookings table...\n";
    try {
        $pdo->exec("ALTER TABLE bookings DROP COLUMN service_id");
        echo "✅ service_id column dropped successfully\n";
    } catch (\PDOException $e) {
        if (strpos($e->getMessage(), "Unknown column 'service_id'") !== false || 
            strpos($e->getMessage(), "Can't DROP COLUMN") !== false) {
            echo "✅ service_id column already dropped (migration completed)\n";
        } else {
            echo "⚠️  Warning: Could not drop service_id column: " . $e->getMessage() . "\n";
            echo "   The column might not exist or there might be other constraints\n";
        }
    }

    // 6. Finally, drop the services table
    echo "6. Dropping services table...\n";
    try {
        $pdo->exec("DROP TABLE services");
        echo "✅ Services table dropped successfully\n";
    } catch (\PDOException $e) {
        echo "❌ Failed to drop services table: " . $e->getMessage() . "\n";
        echo "   There may be other tables referencing the services table\n";
        echo "   You may need to manually check for other foreign key constraints\n";
        exit(1);
    }

    echo "\n🎉 Safe cleanup completed successfully!\n";
    echo "\nSummary:\n";
    echo "- ✅ Foreign key constraints removed\n";
    echo "- ✅ service_id column dropped from bookings table\n";
    echo "- ✅ services table dropped\n";
    echo "\nYour database is now fully migrated to the new pricing system!\n";

} catch (Exception $e) {
    echo "❌ Cleanup failed: " . $e->getMessage() . "\n";
    echo "Please check your database connection and try again.\n";
    exit(1);
}
?>
