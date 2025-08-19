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
require_once "./modules/put.php";
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
$get = new Get($pdo);
$put = new Put($pdo);

// Handle OPTIONS request (CORS preflight)
if ($method === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

// Handle GET requests
if ($method === 'GET') {
    if (strpos($request, 'get_customer_count') !== false) {
        $result = $get->get_customer_count();
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'get_employee_count') !== false) {
        $result = $get->get_employee_count();
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'get_all_customers') !== false) {
        $result = $get->get_all_customers();
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'get_all_employees') !== false) {
        $result = $get->get_all_employees();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_bookings_by_customer') !== false) {
        if (isset($_GET['customer_id'])) {
            $customerId = $_GET['customer_id'];
            $result = $get->get_bookings_by_customer($customerId);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Customer ID is required.']);
        }
        exit();
    }
    
    if (strpos($request, 'services') !== false) {
        $result = $get->get_all_services();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_all_bookings') !== false) {
        $result = $get->get_all_bookings();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_booking_count') !== false) {
        $result = $get->get_booking_count();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_completed_booking_count') !== false) {
        $result = $get->get_completed_booking_count();
        echo json_encode($result);
        exit();
    }
    if (strpos($request, 'get_pending_booking_count') !== false) {
        $result = $get->get_pending_booking_count();
        echo json_encode($result);
        exit();
    }
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
    
    if (strpos($request, 'register_admin') !== false) {
        $result = $post->register_admin($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'login_admin') !== false) {
        $result = $post->login_admin($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'register_employee') !== false) {
        $result = $post->register_employee($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'login_employee') !== false) {
        $result = $post->login_employee($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'services') !== false) {
        $result = $post->add_service($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'create_booking') !== false) {
        $result = $post->create_booking($data);
        echo json_encode($result);
        exit();
    }
}

// Handle PUT requests
if ($method === 'PUT') {
    // Get PUT data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check for JWT token for protected routes
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (strpos($request, 'update_customer_profile') !== false) {
        // Process the update
        $result = $put->update_customer_profile($data);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'services') !== false) {
        // Process the service update
        $result = $put->update_service($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_booking_status') !== false) {
        $result = $put->update_booking_status($data);
        echo json_encode($result);
        exit();
    }
}

// Handle DELETE requests
if ($method === 'DELETE') {
    // Extract ID from URL for delete operations
    $parts = explode('/', $request);
    $id = end($parts);
    
    if (strpos($request, 'services') !== false && is_numeric($id)) {
        $result = $post->delete_service($id);
        echo json_encode($result);
        exit();
    }
}
