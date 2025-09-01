<?php
// Script to insert sample feedback data using actual booking IDs
$host = 'localhost';
$dbname = 'db_autowashhub'; // Using the database name from the image
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Database connection successful!\n\n";
    
    // First, check if customer_feedback table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'customer_feedback'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "❌ customer_feedback table does not exist. Creating it...\n";
        
        // Create the table
        $createTable = "CREATE TABLE IF NOT EXISTS `customer_feedback` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `booking_id` int(11) NOT NULL,
            `customer_id` int(11) NOT NULL,
            `rating` int(1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
            `comment` text,
            `is_public` tinyint(1) NOT NULL DEFAULT 1,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `booking_id` (`booking_id`),
            KEY `customer_id` (`customer_id`),
            KEY `created_at` (`created_at`),
            CONSTRAINT `fk_customer_feedback_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
            CONSTRAINT `fk_customer_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTable);
        echo "✅ customer_feedback table created successfully!\n\n";
    }
    
    // Get actual booking IDs and customer IDs
    $stmt = $pdo->query("SELECT id, customer_id FROM bookings WHERE status = 'Completed' ORDER BY id DESC LIMIT 10");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($bookings)) {
        echo "❌ No completed bookings found in the database.\n";
        echo "Please make sure you have some completed bookings before inserting feedback.\n";
        exit;
    }
    
    echo "📊 Found " . count($bookings) . " completed bookings\n";
    echo "🔍 Available booking IDs: " . implode(', ', array_column($bookings, 'id')) . "\n\n";
    
    // Sample feedback comments
    $sampleComments = [
        'Excellent service! My car looks brand new. Very satisfied with the quality.',
        'Good service overall. The staff was friendly and professional.',
        'Service was okay, but it took longer than expected.',
        'Amazing job! Will definitely come back again.',
        'Very good service. The car wash was thorough and clean.',
        'Outstanding work! My vehicle has never looked better.',
        'Professional service with attention to detail.',
        'Great value for money. Highly recommended!',
        'Quick and efficient service. Very pleased.',
        'Excellent customer service and quality work.'
    ];
    
    // Clear existing feedback data
    $pdo->exec("DELETE FROM customer_feedback");
    echo "🧹 Cleared existing feedback data\n";
    
    // Insert sample feedback using actual booking IDs
    $insertCount = 0;
    foreach ($bookings as $index => $booking) {
        if ($index >= 10) break; // Limit to 10 feedback entries
        
        $rating = rand(3, 5); // Random rating between 3-5
        $comment = $sampleComments[$index % count($sampleComments)];
        $isPublic = rand(0, 1); // Random public/private
        
        $sql = "INSERT INTO customer_feedback (booking_id, customer_id, rating, comment, is_public, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$booking['id'], $booking['customer_id'], $rating, $comment, $isPublic]);
        
        $insertCount++;
        echo "✅ Inserted feedback for booking ID: {$booking['id']} (Rating: $rating)\n";
    }
    
    echo "\n🎉 Successfully inserted $insertCount feedback records!\n\n";
    
    // Verify the data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM customer_feedback");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "📊 Total feedback records in database: $count\n";
    
    // Show sample data
    echo "\n🔍 Sample feedback data:\n";
    $stmt = $pdo->query("SELECT cf.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name 
                        FROM customer_feedback cf 
                        JOIN customers c ON cf.customer_id = c.id 
                        ORDER BY cf.created_at DESC LIMIT 5");
    $sampleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sampleData as $row) {
        echo "  ID: {$row['id']}, Customer: {$row['customer_name']}, Rating: {$row['rating']}, Public: " . ($row['is_public'] ? 'Yes' : 'No') . "\n";
        echo "  Comment: {$row['comment']}\n\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>
