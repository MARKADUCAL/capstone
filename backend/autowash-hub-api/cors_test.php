<?php
// CORS Test Script
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
    exit();
}

// Return CORS test result
echo json_encode([
    'success' => true,
    'message' => 'CORS test successful',
    'origin' => $origin,
    'is_allowed' => $isAllowed,
    'allowed_origins' => $allowedOrigins,
    'timestamp' => date('Y-m-d H:i:s'),
    'headers_sent' => [
        'Access-Control-Allow-Origin' => $isAllowed ? $origin : 'http://localhost:4200',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials' => 'true'
    ]
]);
?>
