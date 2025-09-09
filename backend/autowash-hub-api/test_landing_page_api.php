<?php
// Test script for landing page API endpoints
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'api/config/database.php';
require_once 'api/modules/get.php';
require_once 'api/modules/post.php';

try {
    $connection = new Connection();
    $pdo = $connection->connect();
    
    $get = new Get($pdo);
    $post = new Post($pdo);
    
    echo "=== Landing Page API Test ===\n\n";
    
    // Test 1: Check if tables exist
    echo "1. Checking if tables exist...\n";
    $tables = $pdo->query("SHOW TABLES LIKE 'landing_page%'")->fetchAll();
    echo "Found tables: " . json_encode($tables) . "\n\n";
    
    // Test 2: Check current content
    echo "2. Checking current content...\n";
    $result = $get->get_landing_page_content();
    echo "GET result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
    
    // Test 3: Test update with sample data
    echo "3. Testing update with sample data...\n";
    $testData = [
        'hero' => [
            'title' => 'TEST TITLE',
            'description' => 'Test description',
            'background_url' => 'assets/test.png'
        ],
        'services' => [
            ['name' => 'Test Service', 'image_url' => 'assets/test.png']
        ],
        'gallery' => [
            ['url' => 'assets/test.png', 'alt' => 'Test Image']
        ],
        'contact_info' => [
            'address' => 'Test Address',
            'opening_hours' => 'Test Hours',
            'phone' => 'Test Phone',
            'email' => 'test@test.com'
        ],
        'footer' => [
            'address' => 'Test Footer Address',
            'phone' => 'Test Footer Phone',
            'email' => 'test@footer.com',
            'copyright' => 'Test Copyright',
            'facebook' => '#',
            'instagram' => '#',
            'twitter' => '#',
            'tiktok' => '#'
        ]
    ];
    
    $updateResult = $post->update_landing_page_content($testData);
    echo "UPDATE result: " . json_encode($updateResult, JSON_PRETTY_PRINT) . "\n\n";
    
    // Test 4: Verify the update
    echo "4. Verifying the update...\n";
    $verifyResult = $get->get_landing_page_content();
    echo "VERIFY result: " . json_encode($verifyResult, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "=== Test Complete ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
