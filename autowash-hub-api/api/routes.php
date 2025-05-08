<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "./config/env.php";
loadEnv(__DIR__ . '/.env');

// Include required modules
require_once "./autoload.php";
require_once "./modules/get.php";
require_once "./modules/post.php";
require_once "./config/database.php";

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Get the request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Create database connection
$connection = new Connection();
$pdo = $connection->connect();

// Initialize modules
$post = new Post($pdo);

// Handle OPTIONS request (CORS preflight)
if ($method === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

// Handle the request
if ($method === 'POST') {
    // Get POST data
    $data = json_decode(file_get_contents("php://input"));
    
    if (strpos($request, 'register_customer') !== false) {
        $result = $post->register_customer($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'login_customer') !== false) {
        $result = $post->login_customer($data);
        echo json_encode($result);
        exit();
    }
}
