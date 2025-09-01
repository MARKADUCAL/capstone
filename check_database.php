<?php
// Database connection test script
$host = 'localhost';
$dbname = 'autowash_hub'; // Adjust this to your actual database name
$username = 'root'; // Adjust this to your actual username
$password = ''; // Adjust this to your actual password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Database connection successful!\n\n";
    
    // Check if customer_feedback table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'customer_feedback'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "✅ customer_feedback table exists\n";
        
        // Check table structure
        $stmt = $pdo->query("DESCRIBE customer_feedback");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "📋 Table structure:\n";
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']})\n";
        }
        
        // Check if there's any data
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM customer_feedback");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo "\n📊 Total feedback records: $count\n";
        
        if ($count > 0) {
            echo "\n🔍 Sample feedback data:\n";
            $stmt = $pdo->query("SELECT * FROM customer_feedback LIMIT 3");
            $sampleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($sampleData as $row) {
                echo "  ID: {$row['id']}, Rating: {$row['rating']}, Comment: {$row['comment']}\n";
            }
        } else {
            echo "\n⚠️ No feedback records found in the database\n";
        }
        
    } else {
        echo "❌ customer_feedback table does not exist\n";
        
        // Show available tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "📋 Available tables:\n";
        foreach ($tables as $table) {
            echo "  - $table\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>
