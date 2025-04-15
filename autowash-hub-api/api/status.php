<?php
// api/status.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database and object files
include_once '../database.php';

// Instantiate database
$database = new Database();
$conn = $database->getConnection();

// Prepare response
$response = array();

if($conn) {
    // Try a simple query to verify deeper connection
    try {
        $stmt = $conn->prepare("SELECT 1");
        $stmt->execute();
        
        $response["status"] = "success";
        $response["message"] = "Database connection is working properly";
    } catch(PDOException $e) {
        $response["status"] = "error";
        $response["message"] = "Database connection established but query failed: " . $e->getMessage();
    }
} else {
    $response["status"] = "error";
    $response["message"] = "Database connection failed";
}

// Output response
echo json_encode($response);
?>