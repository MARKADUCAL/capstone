<?php
// Setup script to initialize pricing table
require_once "./api/config/database.php";
require_once "./api/modules/post.php";

// Create database connection
$connection = new Connection();
$pdo = $connection->connect();

// Initialize Post class
$post = new Post($pdo);

// Create pricing table and initialize with default data
$result = $post->create_pricing_table();

echo "Pricing setup result:\n";
echo json_encode($result, JSON_PRETTY_PRINT) . "\n";

if ($result['status']['remarks'] === 'success') {
    echo "\n✅ Pricing table setup completed successfully!\n";
} else {
    echo "\n❌ Pricing table setup failed!\n";
}
?>
