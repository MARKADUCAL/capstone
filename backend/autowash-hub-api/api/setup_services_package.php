<?php
/**
 * Services Package Database Setup Script
 * 
 * This script creates the service_packages, vehicle_types, and pricing tables
 * and populates them with default data.
 * 
 * Access via browser: http://yoursite.com/api/setup_services_package.php
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection configuration
require_once "./config/env.php";
loadEnv(__DIR__ . '/.env');

try {
    // Create PDO connection
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';
    $dbname = $_ENV['DB_NAME'] ?? 'autowash_hub';
    $port = $_ENV['DB_PORT'] ?? 3306;

    // Try connecting with explicit parameters
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname}",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "<h2>Services Package Database Setup</h2>";
    echo "<p>Setting up service_packages, vehicle_types, and pricing tables...</p>";

    // Read and execute the SQL file
    $sqlFile = __DIR__ . '/create_services_package_tables.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }

    $sqlStatements = file_get_contents($sqlFile);
    
    // Split SQL statements and execute them individually
    // This is needed because PDO doesn't support multiple statements in one query by default
    $statements = array_filter(
        array_map('trim', preg_split('/;[\s\n]+/', $sqlStatements)),
        function($stmt) { return !empty($stmt); }
    );

    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            $pdo->exec($statement . ';');
        }
    }

    echo "<h3 style='color: green;'>✓ Setup completed successfully!</h3>";
    echo "<p><strong>Tables created:</strong></p>";
    echo "<ul>";
    echo "<li>service_packages - 4 packages</li>";
    echo "<li>vehicle_types - 4 vehicle types</li>";
    echo "<li>pricing - 16 pricing entries</li>";
    echo "</ul>";

    echo "<p><strong>Next steps:</strong></p>";
    echo "<ol>";
    echo "<li>Test the <code>/api/get_packages</code> endpoint</li>";
    echo "<li>Test the <code>/api/get_service_vehicle_types</code> endpoint</li>";
    echo "<li>Test the <code>/api/get_all_pricing</code> endpoint</li>";
    echo "<li>Try adding a new package in the admin panel</li>";
    echo "</ol>";

    // Verify the tables were created
    echo "<p><strong>Verification:</strong></p>";
    
    $checks = [
        'SELECT COUNT(*) as count FROM service_packages' => 'Service Packages',
        'SELECT COUNT(*) as count FROM vehicle_types' => 'Vehicle Types',
        'SELECT COUNT(*) as count FROM pricing' => 'Pricing Entries'
    ];

    foreach ($checks as $query => $label) {
        $result = $pdo->query($query)->fetch(PDO::FETCH_ASSOC);
        echo "<p>✓ $label: " . $result['count'] . " records</p>";
    }

} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Setup failed!</h3>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Please check your database configuration and try again.</p>";
    error_log("Services Package Setup Error: " . $e->getMessage());
}
?>
