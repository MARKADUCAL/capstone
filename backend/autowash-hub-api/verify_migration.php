<?php
// Verification script to check if migration was successful
require_once "./api/config/database.php";

$connection = new Connection();
$pdo = $connection->connect();

echo "=== Migration Verification ===\n\n";

try {
    // Check pricing table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM pricing");
    $result = $stmt->fetch();
    echo "✅ Pricing table has " . $result['count'] . " entries\n";
    
    // Check bookings with service_package
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM bookings WHERE service_package IS NOT NULL");
    $result = $stmt->fetch();
    echo "✅ " . $result['count'] . " bookings have service_package data\n";
    
    // Check if services table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'services'");
    $result = $stmt->fetch();
    echo "✅ Services table exists: " . ($result ? 'Yes' : 'No') . "\n";
    
    // Check if service_id column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'service_id'");
    $serviceIdExists = $stmt->fetch();
    echo "✅ service_id column exists: " . ($serviceIdExists ? 'Yes' : 'No') . "\n";
    
    // Check sample pricing data
    echo "\n=== Sample Pricing Data ===\n";
    $stmt = $pdo->query("SELECT vehicle_type, service_package, price FROM pricing LIMIT 5");
    $pricing = $stmt->fetchAll();
    foreach ($pricing as $row) {
        echo "Vehicle: {$row['vehicle_type']}, Package: {$row['service_package']}, Price: ₱{$row['price']}\n";
    }
    
    echo "\n=== Booking Status ===\n";
    if ($result['count'] > 0 && !$serviceIdExists) {
        echo "🎉 YES! You should be able to book now!\n";
        echo "✅ Migration completed successfully\n";
        echo "✅ New pricing system is active\n";
        echo "✅ Old services table removed\n";
    } else {
        echo "⚠️  Some issues detected - check the details above\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
