<?php
declare(strict_types=1);

// -----------------------------------------------------------------------------
// test_mail.php
// -----------------------------------------------------------------------------
// Sends a simple test email using Resend.com API to validate email configuration.
// Usage:
//   GET/POST: ?to=recipient@example.com
// Notes:
//   - Uses Resend.com API (no SMTP configuration needed)
//   - Returns JSON with success flag and error details on failure.
// -----------------------------------------------------------------------------

// Enable error display for debugging
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Start output buffering to catch any errors
ob_start();

// Content type and basic CORS
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(200); exit; }

// Load env with error handling
try {
    if (file_exists(__DIR__ . '/../config/env.php')) {
        require_once __DIR__ . '/../config/env.php';
        if (function_exists('loadEnv')) {
            loadEnv(__DIR__ . '/../.env');
        }
    } else {
        throw new Exception('env.php not found');
    }
} catch (Exception $e) {
    ob_clean();
    header('Content-Type: text/html; charset=utf-8');
    echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test - Error</title><style>body{font-family:Arial;margin:24px} .err{color:#b91c1c}</style></head><body><h2 class='err'>❌ Configuration Error</h2><p>" . htmlspecialchars($e->getMessage()) . "</p></body></html>";
    exit;
}

$appEnv = getenv('APP_ENV') ?: 'development';

// Output format: json (default) or html — use ?format=html for a pretty page
$format = isset($_GET['format']) ? strtolower((string)$_GET['format']) : (isset($_POST['format']) ? strtolower((string)$_POST['format']) : 'json');
if ($format !== 'html') {
    header('Content-Type: application/json');
}

// Resend.com API configuration
$resendApiKey = getenv('RESEND_API_KEY') ?: 're_7Jar2b4P_7TeShgpVfkHDwP1d8Dhoir5T';
$resendFromEmail = getenv('RESEND_FROM_EMAIL') ?: 'onboarding@resend.dev';
$resendFromName = getenv('RESEND_FROM_NAME') ?: 'AutoWash Hub';

// Determine recipient
$to = isset($_GET['to']) ? trim((string)$_GET['to']) : (isset($_POST['to']) ? trim((string)$_POST['to']) : '');
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    ob_clean();
    http_response_code(400);
    $payload = ['success' => false, 'error' => 'Provide a valid email in `to` parameter'];
    if ($format === 'html') {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test</title><style>body{font-family:Arial;margin:24px} .err{color:#b91c1c} code{background:#f3f4f6;padding:2px 4px;border-radius:4px}</style></head><body><h2 class='err'>❌ Test failed</h2><p>Provide a valid email in <code>?to=</code> parameter.</p><p><strong>Example:</strong> <code>?to=your-real-email@gmail.com&format=html</code></p></body></html>";
    } else {
        header('Content-Type: application/json');
        echo json_encode($payload);
    }
    exit;
}

// Check if cURL is available
if (!function_exists('curl_init')) {
    ob_clean();
    http_response_code(500);
    if ($format === 'html') {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test - Error</title><style>body{font-family:Arial;margin:24px} .err{color:#b91c1c}</style></head><body><h2 class='err'>❌ cURL not available</h2><p>cURL extension is not enabled in PHP. Please enable it in your PHP configuration.</p></body></html>";
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'cURL extension not available']);
    }
    exit;
}

// Send email via Resend API (works without Composer/SDK)
$payload = [
    'from' => $resendFromEmail,
    'to' => $to,
    'subject' => 'AutoWash Hub Email Test',
    'html' => '<p>This is a test email from AutoWash Hub backend. If you receive this, <strong>Resend.com is working correctly!</strong></p>',
    'text' => 'This is a test email from AutoWash Hub backend. If you receive this, Resend.com is working correctly!'
];

ob_clean(); // Clear any output before sending response

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $resendApiKey,
        'Content-Type: application/json'
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    $errorMsg = 'Connection error: ' . $curlError;
    if ($format === 'html') {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test</title><style>body{font-family:Arial;margin:24px} .err{color:#b91c1c}</style></head><body><h2 class='err'>❌ Connection error</h2><p>" . htmlspecialchars($errorMsg) . "</p></body></html>";
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $errorMsg]);
    }
    exit;
}

$responseData = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300) {
    $resultData = [
        'success' => true,
        'message' => 'Test email sent successfully',
        'to' => $to,
        'email_id' => $responseData['id'] ?? null
    ];
    
    if ($format === 'html') {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test</title><style>body{font-family:Arial;margin:24px} .ok{color:#15803d} code{background:#f3f4f6;padding:2px 4px;border-radius:4px}</style></head><body><h2 class='ok'>✅ Email sent</h2><p><strong>To:</strong> " . htmlspecialchars($to) . "</p><p><strong>Email ID:</strong> <code>" . htmlspecialchars((string)($responseData['id'] ?? 'n/a')) . "</code></p></body></html>";
    } else {
        echo json_encode($resultData);
    }
} else {
    $errorMsg = $responseData['message'] ?? 'Unknown error';
    if (isset($responseData['errors'])) {
        $errorMsg .= ' - ' . json_encode($responseData['errors']);
    }
    http_response_code($httpCode);
    
    if ($format === 'html') {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!doctype html><html><head><meta charset='utf-8'><title>Resend Test</title><style>body{font-family:Arial;margin:24px} .err{color:#b91c1c} pre{background:#f3f4f6;padding:12px;border-radius:6px;overflow:auto}</style></head><body><h2 class='err'>❌ Send failed</h2><p>" . htmlspecialchars($errorMsg) . "</p>" . ($appEnv === 'development' ? ("<pre>" . htmlspecialchars(json_encode($responseData, JSON_PRETTY_PRINT)) . "</pre>") : "") . "</body></html>";
    } else {
        echo json_encode([
            'success' => false,
            'error' => $errorMsg,
            'debug' => $appEnv === 'development' ? $responseData : null
        ]);
    }
}
?>


