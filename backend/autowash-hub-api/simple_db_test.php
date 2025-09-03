<?php
// Simple Database Connection Test
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo "<h2>Simple Database Connection Test</h2>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .success{color:green;} .error{color:red;} .info{color:blue;}</style>";

try {
    require_once './api/config/database.php';
    
    echo "<p class='info'>Testing connection to:</p>";
    echo "<ul>";
    echo "<li>Server: " . SERVER . " (localhost for shared hosting)</li>";
    echo "<li>Database: " . DATABASE . "</li>";
    echo "<li>User: " . USER . "</li>";
    echo "</ul>";
    
    $connection = new Connection();
    $pdo = $connection->connect();
    
    echo "<p class='success'>✅ Database connection successful!</p>";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT 1 as test, NOW() as current_time");
    $result = $stmt->fetch();
    
    echo "<p class='success'>✅ Database query successful!</p>";
    echo "<p>Test result: " . $result['test'] . "</p>";
    echo "<p>Server time: " . $result['current_time'] . "</p>";
    
    // Get server info
    $stmt = $pdo->query("SELECT VERSION() as version");
    $version = $stmt->fetch();
    echo "<p>MySQL version: " . $version['version'] . "</p>";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Database connection failed: " . $e->getMessage() . "</p>";
    
    // Provide specific error guidance
    $error = $e->getMessage();
    if (strpos($error, 'Connection timed out') !== false) {
        echo "<div class='error'>";
        echo "<h4>Connection Timeout Solutions:</h4>";
        echo "<ul>";
        echo "<li>Check if the database server is running</li>";
        echo "<li>Verify the server address is correct</li>";
        echo "<li>Check if port 3306 is open</li>";
        echo "<li>Contact your hosting provider</li>";
        echo "</ul>";
        echo "</div>";
    } elseif (strpos($error, 'Access denied') !== false) {
        echo "<div class='error'>";
        echo "<h4>Access Denied Solutions:</h4>";
        echo "<ul>";
        echo "<li>Check username and password</li>";
        echo "<li>Verify database name is correct</li>";
        echo "<li>Check user permissions</li>";
        echo "</ul>";
        echo "</div>";
    } elseif (strpos($error, 'Unknown database') !== false) {
        echo "<div class='error'>";
        echo "<h4>Database Not Found Solutions:</h4>";
        echo "<ul>";
        echo "<li>Verify the database name is correct</li>";
        echo "<li>Check if the database exists in your hosting panel</li>";
        echo "<li>Create the database if it doesn't exist</li>";
        echo "</ul>";
        echo "</div>";
    }
}
?>