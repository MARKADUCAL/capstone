<?php
// Production-safe: disable verbose error output on public hosting
// (Some free hosts flag ini_set/error_reporting as dangerous)

// CORS headers - Set immediately to avoid any issues
$allowedOrigins = [
    'https://capstone-alpha-lac.vercel.app',
    'https://capstone-70tgpmfq9-markaducals-projects.vercel.app',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default to localhost for development
    header("Access-Control-Allow-Origin: http://localhost:4200");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "./config/env.php";
loadEnv(__DIR__ . '/.env');

// Include required modules
require_once "./autoload.php";
require_once "./modules/get.php";
require_once "./modules/post.php";
require_once "./modules/put.php";
require_once "./config/database.php";

// Manually include JWT library to ensure it's loaded
require_once "./vendor/firebase/php-jwt/JWT.php";

// Import JWT for token validation
use Firebase\JWT\JWT;

// CORS configuration is now handled at the top of the file

// Get the request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Handle rewritten URLs from .htaccess
if (isset($_GET['request'])) {
    $request = '/' . $_GET['request'];
}

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
    // Status page for root access
    if ($request === '/' || $request === '/api/' || $request === '/api' || strpos($request, 'status') !== false) {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoWash Hub API - Status</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 600px;
            margin: 20px;
        }
        .logo {
            font-size: 3em;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .status {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 30px;
        }
        .info {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .info h3 {
            color: #333;
            margin-top: 0;
        }
        .info p {
            color: #666;
            line-height: 1.6;
        }
        .endpoints {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .endpoint {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2196F3;
        }
        .endpoint strong {
            color: #1976D2;
        }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚗💧</div>
        <h1>AutoWash Hub API</h1>
        <p class="subtitle">Car Wash Management System</p>
        
        <div class="status">✅ API is Online and Working!</div>
        
        <div class="info">
            <h3>🎉 Welcome to AutoWash Hub API</h3>
            <p>Your API is successfully deployed and running on Hostinger. This system provides comprehensive car wash management functionality including:</p>
            <ul>
                <li>Customer and Employee Management</li>
                <li>Booking and Appointment System</li>
                <li>Inventory Management</li>
                <li>Payment Processing</li>
                <li>Analytics and Reporting</li>
            </ul>
        </div>
        
        <div class="info">
            <h3>🔗 API Endpoints</h3>
            <div class="endpoints">
                <div class="endpoint">
                    <strong>Authentication</strong><br>
                    POST /login_customer<br>
                    POST /register_customer
                </div>
                <div class="endpoint">
                    <strong>Bookings</strong><br>
                    GET /get_all_bookings<br>
                    POST /create_booking
                </div>
                <div class="endpoint">
                    <strong>Inventory</strong><br>
                    GET /get_inventory<br>
                    POST /add_inventory_item
                </div>
                <div class="endpoint">
                    <strong>Analytics</strong><br>
                    GET /get_dashboard_summary<br>
                    GET /get_revenue_analytics
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🚀 Deployed on Hostinger | 📅 ' . date('Y-m-d H:i:s') . ' | 🌍 Timezone: Asia/Manila</p>
            <p>For API documentation, please refer to the API_DOCUMENTATION.md file</p>
        </div>
    </div>
</body>
</html>';
        exit();
    }
    
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
    
    if (strpos($request, 'get_customer_id_sequence') !== false) {
        $result = $post->get_customer_id_sequence();
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
    


    if (strpos($request, 'get_all_bookings') !== false) {
        $result = $get->get_all_bookings();
        echo json_encode($result);
        exit();
    }

    // Inventory routes
    if (strpos($request, 'get_inventory_requests') !== false) {
        $result = $get->get_inventory_requests();
        echo json_encode($result);
        exit();
    }

    // Get inventory history
    if (strpos($request, 'get_inventory_history') !== false) {
        $result = $get->get_inventory_history();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_inventory') !== false) {
        $result = $get->get_inventory();
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

    if (strpos($request, 'get_revenue_analytics') !== false) {
        $result = $get->get_revenue_analytics();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_service_distribution') !== false) {
        $result = $get->get_service_distribution();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_dashboard_summary') !== false) {
        $result = $get->get_dashboard_summary();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_contact_enquiries') !== false) {
        $result = $get->get_contact_enquiries();
        echo json_encode($result);
        exit();
    }

    // New GET routes for updated database schema
    if (strpos($request, 'get_vehicle_types') !== false) {
        $result = $get->get_vehicle_types();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_payment_methods') !== false) {
        $result = $get->get_payment_methods();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_time_slots') !== false) {
        $result = $get->get_time_slots();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_available_time_slots') !== false) {
        if (isset($_GET['date'])) {
            $date = $_GET['date'];
            $result = $get->get_available_time_slots($date);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Date parameter is required.']);
        }
        exit();
    }

    // Pricing GET routes
    if (strpos($request, 'get_all_pricing') !== false) {
        $result = $get->get_all_pricing();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_pricing_matrix') !== false) {
        $result = $get->get_pricing_matrix();
        echo json_encode($result);
        exit();
    }



    if (strpos($request, 'get_service_categories') !== false) {
        $result = $get->get_service_categories();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_customer_feedback') !== false) {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $result = $get->get_customer_feedback($limit);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_employee_schedules') !== false) {
        $employeeId = isset($_GET['employee_id']) ? $_GET['employee_id'] : null;
        $date = isset($_GET['date']) ? $_GET['date'] : null;
        $result = $get->get_employee_schedules($employeeId, $date);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_system_settings') !== false) {
        $result = $get->get_system_settings();
        echo json_encode($result);
        exit();
    }



    if (strpos($request, 'get_booking_details') !== false) {
        if (isset($_GET['booking_id'])) {
            $bookingId = $_GET['booking_id'];
            $result = $get->get_booking_details($bookingId);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Booking ID is required.']);
        }
        exit();
    }

    if (strpos($request, 'get_booking_history') !== false) {
        if (isset($_GET['booking_id'])) {
            $bookingId = $_GET['booking_id'];
            $result = $get->get_booking_history($bookingId);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Booking ID is required.']);
        }
        exit();
    }

    if (strpos($request, 'get_bookings_by_employee') !== false) {
        if (isset($_GET['employee_id'])) {
            $employeeId = $_GET['employee_id'];
            $result = $get->get_bookings_by_employee($employeeId);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Employee ID is required.']);
        }
        exit();
    }

    // Test connection endpoint - actually test database connection
    if (strpos($request, 'test_connection') !== false) {
        try {
            // Test database connection
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
        
        echo json_encode($response);
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
    


    if (strpos($request, 'create_booking') !== false) {
        $result = $post->create_booking($data);
        echo json_encode($result);
        exit();
    }

    // New POST routes for updated database schema
    if (strpos($request, 'add_vehicle_type') !== false) {
        $result = $post->add_vehicle_type($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'add_payment_method') !== false) {
        $result = $post->add_payment_method($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'add_time_slot') !== false) {
        $result = $post->add_time_slot($data);
        echo json_encode($result);
        exit();
    }

    // Pricing management routes
    if (strpos($request, 'create_pricing_table') !== false) {
        $result = $post->create_pricing_table();
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'add_pricing_entry') !== false) {
        $result = $post->add_pricing_entry($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'get_pricing') !== false) {
        if (isset($_GET['vehicle_type']) && isset($_GET['service_package'])) {
            $result = $post->get_pricing($_GET['vehicle_type'], $_GET['service_package']);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Vehicle type and service package are required.']);
        }
        exit();
    }

    if (strpos($request, 'delete_pricing_entry') !== false) {
        if (isset($_GET['id'])) {
            $result = $post->delete_pricing_entry($_GET['id']);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Pricing entry ID is required.']);
        }
        exit();
    }



    if (strpos($request, 'add_service_category') !== false) {
        $result = $post->add_service_category($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'add_customer_feedback') !== false) {
        $result = $post->add_customer_feedback($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'add_employee_schedule') !== false) {
        $result = $post->add_employee_schedule($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'submit_contact') !== false) {
        $result = $post->submit_contact($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_contact_status') !== false) {
        $result = $post->update_contact_status($data);
        echo json_encode($result);
        exit();
    }

    // Inventory create
    if (strpos($request, 'add_inventory_item') !== false) {
        $result = $post->add_inventory_item($data);
        echo json_encode($result);
        exit();
    }

    // Inventory request
    if (strpos($request, 'add_inventory_request') !== false) {
        $result = $post->add_inventory_request($data);
        echo json_encode($result);
        exit();
    }

    // Take inventory item for employee
    if (strpos($request, 'take_inventory_item') !== false) {
        $result = $post->take_inventory_item($data);
        echo json_encode($result);
        exit();
    }



    if (strpos($request, 'add_booking_history') !== false) {
        $result = $post->add_booking_history($data);
        echo json_encode($result);
        exit();
    }
}

// Handle PUT requests
if ($method === 'PUT') {
    // Debug logging
    error_log("PUT request received: " . $request);
    error_log("Request method: " . $method);
    
    // Get PUT data
    $rawData = file_get_contents("php://input");
    error_log("Raw PUT data: " . $rawData);
    
    $data = json_decode($rawData);
    error_log("Decoded PUT data: " . json_encode($data));
    
    // Check for JWT token for protected routes
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (strpos($request, 'update_customer_profile') !== false) {
        // Process the update
        $result = $put->update_customer_profile($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_employee') !== false) {
        $result = $put->update_employee($data);
        echo json_encode($result);
        exit();
    }
    


    if (strpos($request, 'update_booking_status') !== false) {
        error_log("Processing update_booking_status request");
        $result = $put->update_booking_status($data);
        error_log("update_booking_status result: " . json_encode($result));
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'assign_employee_to_booking') !== false) {
        error_log("Processing assign_employee_to_booking request");
        $result = $put->assign_employee_to_booking($data);
        error_log("assign_employee_to_booking result: " . json_encode($result));
        echo json_encode($result);
        exit();
    }
    
    // Test endpoint to verify routing
    if (strpos($request, 'test_put') !== false) {
        error_log("Test PUT endpoint reached");
        echo json_encode(['status' => 'success', 'message' => 'PUT routing is working', 'request' => $request]);
        exit();
    }

    // New PUT routes for updated database schema
    if (strpos($request, 'update_vehicle_type') !== false) {
        $result = $put->update_vehicle_type($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_payment_method') !== false) {
        $result = $put->update_payment_method($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_time_slot') !== false) {
        $result = $put->update_time_slot($data);
        echo json_encode($result);
        exit();
    }

    // Pricing PUT routes
    if (strpos($request, 'update_pricing_entry') !== false) {
        error_log("Processing update_pricing_entry request");
        error_log("Data for update_pricing_entry: " . json_encode($data));
        
        // Validate JWT token for admin access
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            error_log("Missing or invalid Authorization header");
            http_response_code(401);
            echo json_encode(['status' => 'failed', 'message' => 'Authentication required']);
            exit();
        }
        
        $token = substr($authHeader, 7); // Remove 'Bearer ' prefix
        try {
            $key = getenv('JWT_SECRET') ?: 'default_secret_key';
            $decoded = JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
            
            // Check if token is for admin
            if ($decoded->aud !== 'admin') {
                error_log("Token is not for admin access");
                http_response_code(403);
                echo json_encode(['status' => 'failed', 'message' => 'Admin access required']);
                exit();
            }
            
            error_log("JWT validation successful for admin: " . $decoded->data->email);
        } catch (Exception $e) {
            error_log("JWT validation failed: " . $e->getMessage());
            http_response_code(401);
            echo json_encode(['status' => 'failed', 'message' => 'Invalid token']);
            exit();
        }
        
        $result = $put->update_pricing_entry($data);
        error_log("update_pricing_entry result: " . json_encode($result));
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'toggle_pricing_status') !== false) {
        error_log("Processing toggle_pricing_status request");
        error_log("Data for toggle_pricing_status: " . json_encode($data));
        
        // Validate JWT token for admin access
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            error_log("Missing or invalid Authorization header");
            http_response_code(401);
            echo json_encode(['status' => 'failed', 'message' => 'Authentication required']);
            exit();
        }
        
        $token = substr($authHeader, 7); // Remove 'Bearer ' prefix
        try {
            $key = getenv('JWT_SECRET') ?: 'default_secret_key';
            $decoded = JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
            
            // Check if token is for admin
            if ($decoded->aud !== 'admin') {
                error_log("Token is not for admin access");
                http_response_code(403);
                echo json_encode(['status' => 'failed', 'message' => 'Admin access required']);
                exit();
            }
            
            error_log("JWT validation successful for admin: " . $decoded->data->email);
        } catch (Exception $e) {
            error_log("JWT validation failed: " . $e->getMessage());
            http_response_code(401);
            echo json_encode(['status' => 'failed', 'message' => 'Invalid token']);
            exit();
        }
        
        $result = $put->toggle_pricing_status($data);
        error_log("toggle_pricing_status result: " . json_encode($result));
        echo json_encode($result);
        exit();
    }



    if (strpos($request, 'update_service_category') !== false) {
        $result = $put->update_service_category($data);
        echo json_encode($result);
        exit();
    }

    if (strpos($request, 'update_employee_schedule') !== false) {
        $result = $put->update_employee_schedule($data);
        echo json_encode($result);
        exit();
    }

    // Inventory update
    if (strpos($request, 'update_inventory_item') !== false) {
        $result = $put->update_inventory_item($data);
        echo json_encode($result);
        exit();
    }

    // Inventory request update
    if (strpos($request, 'update_inventory_request') !== false) {
        $result = $put->update_inventory_request($data);
        echo json_encode($result);
        exit();
    }



    if (strpos($request, 'update_system_setting') !== false) {
        $result = $put->update_system_setting($data);
        echo json_encode($result);
        exit();
    }
}

// Handle DELETE requests
if ($method === 'DELETE') {
    // Extract ID from URL for delete operations
    $parts = explode('/', $request);
    $id = end($parts);
    

    
    if (strpos($request, 'customers') !== false && is_numeric($id)) {
        $result = $post->delete_customer($id);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'employees') !== false && is_numeric($id)) {
        $result = $post->delete_employee($id);
        echo json_encode($result);
        exit();
    }
    
    if (strpos($request, 'bookings') !== false && is_numeric($id)) {
        $result = $post->delete_booking($id);
        echo json_encode($result);
        exit();
    }

    // Inventory delete
    if (strpos($request, 'inventory') !== false && is_numeric($id)) {
        $result = $post->delete_inventory_item($id);
        echo json_encode($result);
        exit();
    }

    // Contact enquiry delete
    if (strpos($request, 'delete_contact_enquiry') !== false && is_numeric($id)) {
        $result = $post->delete_contact_enquiry($id);
        echo json_encode($result);
        exit();
    }
}
