<?php
// Simple Database Connection Test
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = "sql.brown-octopus-872555.hostingersite.com";
$dbname = "u835265537_autowash";
$username = "u835265537_aducalremegioO";
$password = "f3>S-A>Mt";

$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

// Test 1: Basic connectivity
$response['tests']['server_connectivity'] = [
    'test' => 'Server Connectivity',
    'status' => 'testing'
];

$connection = @fsockopen($host, 3306, $errno, $errstr, 5);
if ($connection) {
    $response['tests']['server_connectivity']['status'] = 'success';
    $response['tests']['server_connectivity']['message'] = 'Server is reachable';
    fclose($connection);
} else {
    $response['tests']['server_connectivity']['status'] = 'error';
    $response['tests']['server_connectivity']['message'] = "Cannot connect: $errstr ($errno)";
}

// Test 2: DNS Resolution
$ip = gethostbyname($host);
if ($ip === $host) {
    $response['tests']['dns_resolution'] = [
        'test' => 'DNS Resolution',
        'status' => 'error',
        'message' => 'DNS resolution failed'
    ];
} else {
    $response['tests']['dns_resolution'] = [
        'test' => 'DNS Resolution',
        'status' => 'success',
        'message' => "Resolved to: $ip"
    ];
}

// Test 3: Database Connection
try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    $response['tests']['database_connection'] = [
        'test' => 'Database Connection',
        'status' => 'success',
        'message' => 'Connected successfully'
    ];
    
    // Test query
    $stmt = $pdo->query("SELECT 1 as test, NOW() as server_time");
    $result = $stmt->fetch();
    
    $response['tests']['database_query'] = [
        'test' => 'Database Query',
        'status' => 'success',
        'message' => 'Query executed successfully',
        'data' => $result
    ];
    
} catch (Exception $e) {
    $response['tests']['database_connection'] = [
        'test' => 'Database Connection',
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Overall status
$has_errors = false;
foreach ($response['tests'] as $test) {
    if ($test['status'] === 'error') {
        $has_errors = true;
        break;
    }
}

$response['overall_status'] = $has_errors ? 'error' : 'success';
$response['summary'] = $has_errors ? 'Some tests failed' : 'All tests passed';

echo json_encode($response, JSON_PRETTY_PRINT);
?>

