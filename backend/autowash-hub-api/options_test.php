<?php
// OPTIONS Test Script
header('Content-Type: application/json');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
$allowedOrigins = [
    'https://capstone-alpha-lac.vercel.app',
    'https://capstone-70tgpmfq9-markaducals-projects.vercel.app',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// Check if origin is allowed
$isAllowed = in_array($origin, $allowedOrigins) || preg_match('/^https:\/\/.*\.vercel\.app$/', $origin);

// Set CORS headers
if ($isAllowed) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:4200");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'OPTIONS preflight successful',
        'origin' => $origin,
        'is_allowed' => $isAllowed,
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit();
}

// Return test result for other methods
echo json_encode([
    'success' => true,
    'message' => 'OPTIONS test endpoint working',
    'origin' => $origin,
    'is_allowed' => $isAllowed,
    'method' => $_SERVER['REQUEST_METHOD'],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>

