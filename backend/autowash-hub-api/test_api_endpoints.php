<?php
/**
 * API Endpoints Test Script
 * This script tests the landing page API endpoints
 */

echo "<h1>Landing Page API Test</h1>\n";

// Test the GET endpoint
echo "<h2>Testing GET /api/landing_page_content</h2>\n";

$url = 'https://brown-octopus-872555.hostingersite.com/api/landing_page_content';
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json',
        'timeout' => 30
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    echo "<p style='color: red;'>✗ Failed to connect to API endpoint</p>\n";
    echo "<p>Error: " . error_get_last()['message'] . "</p>\n";
} else {
    $data = json_decode($response, true);
    
    if ($data && isset($data['status'])) {
        if ($data['status']['remarks'] === 'success') {
            echo "<p style='color: green;'>✓ GET endpoint working</p>\n";
            echo "<p>Response: " . htmlspecialchars($response) . "</p>\n";
        } else {
            echo "<p style='color: orange;'>⚠ GET endpoint responded with error</p>\n";
            echo "<p>Error: " . htmlspecialchars($data['status']['message']) . "</p>\n";
        }
    } else {
        echo "<p style='color: red;'>✗ Invalid response format</p>\n";
        echo "<p>Response: " . htmlspecialchars($response) . "</p>\n";
    }
}

// Test the POST endpoint
echo "<h2>Testing POST /api/update_landing_page_content</h2>\n";

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
        'address' => 'Test Address',
        'phone' => 'Test Phone',
        'email' => 'test@test.com',
        'copyright' => 'Test Copyright',
        'facebook' => '#',
        'instagram' => '#',
        'twitter' => '#',
        'tiktok' => '#'
    ]
];

$postUrl = 'https://brown-octopus-872555.hostingersite.com/api/update_landing_page_content';
$postContext = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($testData),
        'timeout' => 30
    ]
]);

$postResponse = @file_get_contents($postUrl, false, $postContext);

if ($postResponse === false) {
    echo "<p style='color: red;'>✗ Failed to connect to POST endpoint</p>\n";
    echo "<p>Error: " . error_get_last()['message'] . "</p>\n";
} else {
    $postData = json_decode($postResponse, true);
    
    if ($postData && isset($postData['status'])) {
        if ($postData['status']['remarks'] === 'success') {
            echo "<p style='color: green;'>✓ POST endpoint working</p>\n";
            echo "<p>Response: " . htmlspecialchars($postResponse) . "</p>\n";
        } else {
            echo "<p style='color: orange;'>⚠ POST endpoint responded with error</p>\n";
            echo "<p>Error: " . htmlspecialchars($postData['status']['message']) . "</p>\n";
        }
    } else {
        echo "<p style='color: red;'>✗ Invalid POST response format</p>\n";
        echo "<p>Response: " . htmlspecialchars($postResponse) . "</p>\n";
    }
}

echo "<h2>Summary</h2>\n";
echo "<p>If both tests show green checkmarks, your API is working correctly.</p>\n";
echo "<p>If you see errors, you need to:</p>\n";
echo "<ol>\n";
echo "<li>Run the setup script: <a href='setup_landing_page.php'>setup_landing_page.php</a></li>\n";
echo "<li>Or manually run the SQL script in phpMyAdmin</li>\n";
echo "</ol>\n";
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
</style>
