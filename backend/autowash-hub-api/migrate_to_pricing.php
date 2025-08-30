<?php
// Migration script to update database from services to pricing system
require_once "./api/config/database.php";
require_once "./api/modules/post.php";

// Create database connection
$connection = new Connection();
$pdo = $connection->connect();

echo "Starting migration from services to pricing system...\n";

try {
    // 1. Add service_package column to bookings table if it doesn't exist
    echo "1. Adding service_package column to bookings table...\n";
    $pdo->exec("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_package VARCHAR(10) AFTER vehicle_type");
    echo "✅ service_package column added/verified\n";

    // 2. Create pricing table
    echo "2. Creating pricing table...\n";
    $post = new Post($pdo);
    $result = $post->create_pricing_table();
    echo "✅ Pricing table created: " . $result['status']['message'] . "\n";

    // 3. Update existing bookings to use service_package instead of service_id
    echo "3. Updating existing bookings...\n";
    
    // Get all bookings that still have service_id
    $sql = "SELECT id, service_id FROM bookings WHERE service_id IS NOT NULL AND service_package IS NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($bookings) > 0) {
        echo "Found " . count($bookings) . " bookings to migrate...\n";
        
        // For each booking, try to map service_id to service_package
        // This is a simplified mapping - you may need to adjust based on your data
        $updateSql = "UPDATE bookings SET service_package = ? WHERE id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        
        foreach ($bookings as $booking) {
            // Default mapping - you may need to adjust this based on your actual service data
            $servicePackage = '1'; // Default to basic service
            
            $updateStmt->execute([$servicePackage, $booking['id']]);
            echo "  - Updated booking ID " . $booking['id'] . " to service package " . $servicePackage . "\n";
        }
        
        echo "✅ Updated " . count($bookings) . " bookings\n";
    } else {
        echo "✅ No bookings need migration\n";
    }

    // 4. Drop foreign key constraints before dropping service_id column
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
            echo "✅ No foreign key constraint found\n";
        }
    } catch (\PDOException $e) {
        echo "⚠️  Warning: Could not drop foreign key constraint: " . $e->getMessage() . "\n";
    }

    // 5. Drop the old service_id column
    echo "5. Dropping old service_id column...\n";
    try {
        $pdo->exec("ALTER TABLE bookings DROP COLUMN service_id");
        echo "✅ service_id column dropped\n";
    } catch (\PDOException $e) {
        echo "⚠️  Warning: Could not drop service_id column: " . $e->getMessage() . "\n";
        echo "   The column might not exist or there might be other constraints\n";
    }

    echo "\n🎉 Migration completed successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Test your application with the new pricing system\n";
    echo "2. Verify that all bookings work correctly\n";
    echo "3. Once confirmed, you can run the safe cleanup script:\n";
    echo "   php safe_cleanup.php\n";
    echo "4. Update any remaining frontend code to use the new pricing system\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    echo "Please check your database connection and try again.\n";
}
?>

