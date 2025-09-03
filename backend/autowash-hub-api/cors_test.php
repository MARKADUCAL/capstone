<?php
// Simple CORS test script
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'message' => 'CORS test successful!',
    'timestamp' => date('Y-m-d H:i:s'),
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin header'
]);
?>

