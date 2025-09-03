<?php
// Database Diagnostic Script
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo "<h2>Database Connection Diagnostic</h2>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .success{color:green;} .error{color:red;} .info{color:blue;} .section{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:5px;}</style>";

// Test 1: Basic server connectivity
echo "<div class='section'>";
echo "<h3>Test 1: Server Connectivity</h3>";
$server = "sql.brown-octopus-872555.hostingersite.com";
$port = 3306;

echo "<p>Testing connection to: <strong>$server:$port</strong></p>";

$connection = @fsockopen($server, $port, $errno, $errstr, 10);
if ($connection) {
    echo "<p class='success'>✅ Server is reachable on port $port</p>";
    fclose($connection);
} else {
    echo "<p class='error'>❌ Cannot connect to server: $errstr ($errno)</p>";
    echo "<p class='info'>This could mean:</p>";
    echo "<ul>";
    echo "<li>Server is down</li>";
    echo "<li>Port 3306 is blocked</li>";
    echo "<li>Firewall is blocking the connection</li>";
    echo "<li>Server address is incorrect</li>";
    echo "</ul>";
}
echo "</div>";

// Test 2: DNS Resolution
echo "<div class='section'>";
echo "<h3>Test 2: DNS Resolution</h3>";
$ip = gethostbyname($server);
if ($ip === $server) {
    echo "<p class='error'>❌ DNS resolution failed for $server</p>";
} else {
    echo "<p class='success'>✅ DNS resolved: $server → $ip</p>";
}
echo "</div>";

// Test 3: Database connection with timeout
echo "<div class='section'>";
echo "<h3>Test 3: Database Connection</h3>";

// Include database config
require_once './api/config/database.php';

try {
    echo "<p>Attempting to connect to database...</p>";
    echo "<p>Server: " . SERVER . "</p>";
    echo "<p>Database: " . DATABASE . "</p>";
    echo "<p>User: " . USER . "</p>";
    
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
    }
}

echo "</div>";

// Test 4: Alternative connection methods
echo "<div class='section'>";
echo "<h3>Test 4: Alternative Connection Test</h3>";

try {
    // Try with different timeout settings
    $dsn = "mysql:host=" . SERVER . ";dbname=" . DATABASE . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5, // 5 second timeout
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];
    
    echo "<p>Trying connection with 5-second timeout...</p>";
    $pdo2 = new PDO($dsn, USER, PASSWORD, $options);
    echo "<p class='success'>✅ Alternative connection successful!</p>";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Alternative connection failed: " . $e->getMessage() . "</p>";
}

echo "</div>";

// Test 5: Check if it's a hosting issue
echo "<div class='section'>";
echo "<h3>Test 5: Hosting Environment Check</h3>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>PDO Available: " . (extension_loaded('pdo') ? 'Yes' : 'No') . "</p>";
echo "<p>PDO MySQL Available: " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "</p>";
echo "<p>Current Time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Server Timezone: " . date_default_timezone_get() . "</p>";

// Check if we can reach other services
echo "<p>Testing external connectivity...</p>";
$test_url = "https://www.google.com";
$context = stream_context_create([
    "http" => [
        "timeout" => 5
    ]
]);

$result = @file_get_contents($test_url, false, $context);
if ($result !== false) {
    echo "<p class='success'>✅ External connectivity works</p>";
} else {
    echo "<p class='error'>❌ External connectivity issues</p>";
}

echo "</div>";

echo "<div class='section'>";
echo "<h3>Recommendations</h3>";
echo "<ol>";
echo "<li><strong>Contact Hostinger Support:</strong> The database server may be down or experiencing issues</li>";
echo "<li><strong>Check Hostinger Control Panel:</strong> Verify database status in your hosting dashboard</li>";
echo "<li><strong>Verify Database Credentials:</strong> Double-check username, password, and database name</li>";
echo "<li><strong>Check Database Server Status:</strong> The server 'sql.brown-octopus-872555.hostingersite.com' may be temporarily unavailable</li>";
echo "</ol>";
echo "</div>";
?>

