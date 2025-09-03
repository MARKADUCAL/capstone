<?php
// Prevent any output before headers
ob_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(0);
}

// Clear any output buffer
ob_clean();

try {
    require_once '../config/database.php';
    
    $connection = new Connection();
    $pdo = $connection->connect();
    
    // Test if we can actually query the database
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    if ($result && $result['test'] == 1) {
        $response = [
            'success' => true,
            'message' => 'Database connection successful',
            'timestamp' => date('Y-m-d H:i:s'),
            'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION)
        ];
    } else {
        $response = [
            'success' => false,
            'message' => 'Database query test failed'
        ];
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Connection failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

// Clear any output buffer again before sending JSON
ob_clean();

// Send JSON response
echo json_encode($response);

// End output buffer
ob_end_flush();
?>
