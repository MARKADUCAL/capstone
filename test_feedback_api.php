<?php
// Test script to verify feedback API endpoint
$apiUrl = 'http://localhost/autowash-hub-api/api/get_customer_feedback?limit=10';

echo "🔍 Testing Feedback API Endpoint\n";
echo "URL: $apiUrl\n\n";

// Make the request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "📊 HTTP Response Code: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    echo "✅ Response received successfully\n";
    echo "📄 Response content:\n";
    echo "----------------------------------------\n";
    echo $response;
    echo "\n----------------------------------------\n";
    
    // Parse JSON response
    $data = json_decode($response, true);
    if ($data) {
        echo "\n📋 Parsed Response:\n";
        echo "Status: " . ($data['status']['remarks'] ?? 'Unknown') . "\n";
        echo "Message: " . ($data['status']['message'] ?? 'No message') . "\n";
        
        if (isset($data['payload']['customer_feedback'])) {
            $feedbackCount = count($data['payload']['customer_feedback']);
            echo "📊 Feedback Count: $feedbackCount\n";
            
            if ($feedbackCount > 0) {
                echo "\n🔍 First Feedback Item:\n";
                print_r($data['payload']['customer_feedback'][0]);
            }
        } else {
            echo "⚠️ No customer_feedback found in payload\n";
        }
    } else {
        echo "❌ Failed to parse JSON response\n";
    }
}
?>
