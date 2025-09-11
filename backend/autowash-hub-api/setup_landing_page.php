<?php
/**
 * Landing Page Setup Script
 * This script helps set up the landing page content management system
 */

require_once "./api/config/database.php";

echo "<h1>Landing Page Setup</h1>\n";

try {
    // Test database connection
    $connection = new Connection();
    $pdo = $connection->connect();
    echo "<p style='color: green;'>✓ Database connection successful</p>\n";
    
    // Check if tables exist
    $tables = ['landing_page_content', 'landing_page_media'];
    $missing_tables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        if (!$stmt->fetch()) {
            $missing_tables[] = $table;
        }
    }
    
    if (empty($missing_tables)) {
        echo "<p style='color: green;'>✓ All required tables exist</p>\n";
        
        // Check if content exists
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM landing_page_content");
        $stmt->execute();
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            echo "<p style='color: green;'>✓ Landing page content is set up</p>\n";
            echo "<p><strong>Setup is complete!</strong> You can now use the admin pages to edit the landing page.</p>\n";
        } else {
            echo "<p style='color: orange;'>⚠ Tables exist but no content found. Running setup...</p>\n";
            runSetup($pdo);
        }
    } else {
        echo "<p style='color: red;'>✗ Missing tables: " . implode(', ', $missing_tables) . "</p>\n";
        echo "<p><strong>Action required:</strong> You need to run the SQL script to create the tables.</p>\n";
        echo "<h3>SQL Script to Run:</h3>\n";
        echo "<textarea style='width: 100%; height: 200px;'>";
        echo file_get_contents('./create_landing_page_tables.sql');
        echo "</textarea>\n";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error: " . $e->getMessage() . "</p>\n";
    echo "<p>Please check your database configuration in api/config/database.php</p>\n";
}

function runSetup($pdo) {
    try {
        // Read and execute the SQL script
        $sql = file_get_contents('./create_landing_page_tables.sql');
        
        // Split by semicolon and execute each statement
        $statements = explode(';', $sql);
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        echo "<p style='color: green;'>✓ Setup completed successfully!</p>\n";
        echo "<p><strong>You can now use the admin pages to edit the landing page.</strong></p>\n";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Setup failed: " . $e->getMessage() . "</p>\n";
    }
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
textarea { font-family: monospace; font-size: 12px; }
</style>
