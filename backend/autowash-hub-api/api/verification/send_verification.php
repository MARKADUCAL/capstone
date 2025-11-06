<?php
declare(strict_types=1);

// -----------------------------------------------------------------------------
// send_verification.php
// -----------------------------------------------------------------------------
// Purpose:
// - Accepts POST { name, email, password }
// - Creates a 6-digit verification code and expiration timestamp
// - Saves user + code into the database (status = 'unverified')
// - Sends the verification code to the user's email using Resend.com API
// - Returns JSON with success or error details
// -----------------------------------------------------------------------------

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS headers
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://capstone-alpha-lac.vercel.app',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://brown-octopus-872555.hostingersite.com',
    'https://autowashhub.online'
];
if (in_array($origin, $allowedOrigins) || preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:4200");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load environment variables from .env file
require_once __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');

// Load database configuration
require_once __DIR__ . '/../config/database.php';

// --------------------------- Configuration -----------------------------------
// Resend.com API configuration
// Get your API key from: https://resend.com/api-keys
$resendApiKey = getenv('RESEND_API_KEY') ?: 're_7Jar2b4P_7TeShgpVfkHDwP1d8Dhoir5T';
$resendFromEmail = getenv('RESEND_FROM_EMAIL') ?: 'onboarding@resend.dev'; // Use your verified domain
$resendFromName = getenv('RESEND_FROM_NAME') ?: 'AutoWash Hub';
$appEnv = getenv('APP_ENV') ?: 'development';

// Verification code expiry in minutes
$codeTtlMinutes = 10;

// --------------------------- Input Validation --------------------------------
// Expected POST body: name, email, password
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$rawInput = file_get_contents('php://input') ?: '';
$data = json_decode($rawInput, true);
if (!is_array($data)) {
    // Fallback to application/x-www-form-urlencoded
    $data = $_POST;
}

$name = isset($data['name']) ? trim((string)$data['name']) : '';
$email = isset($data['email']) ? trim((string)$data['email']) : '';
$password = isset($data['password']) ? (string)$data['password'] : '';

if ($name === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: name, email, password']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}

// --------------------------- DB Connection -----------------------------------
try {
    $connection = new Connection();
    $pdo = $connection->connect();
} catch (Throwable $t) {
    error_log('DB connection error: ' . $t->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed', 'debug' => $appEnv === 'development' ? $t->getMessage() : null]);
    exit;
}

// --------------------------- User + Code Logic -------------------------------
// Create a secure 6-digit code and expiration timestamp.
$verificationCode = (string)random_int(100000, 999999);
$expiresAt = (new DateTimeImmutable('+'.(int)$codeTtlMinutes.' minutes'))
    ->format('Y-m-d H:i:s');

// Hash the password for storage.
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Ensure a users table exists with the following relevant columns:
//   id (PK, auto-increment), name, email (unique), password_hash,
//   verification_code, verification_expires_at (DATETIME), status ('unverified'|'verified'),
//   created_at (DATETIME), updated_at (DATETIME)
// Create or update the user row. If email exists and is unverified, update the code.

$pdo->beginTransaction();
try {
    // Try to insert a new user. If email already exists, handle it below.
    $insertSql = 'INSERT INTO users (name, email, password_hash, verification_code, verification_expires_at, status, created_at, updated_at)
                  VALUES (:name, :email, :password_hash, :code, :expires_at, :status, NOW(), NOW())';
    $stmt = $pdo->prepare($insertSql);
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':code' => $verificationCode,
        ':expires_at' => $expiresAt,
        ':status' => 'unverified',
    ]);
    $createdNew = true;
} catch (PDOException $e) {
    // Duplicate email: update existing unverified user with new password + code
    if ((int)$e->getCode() === 23000 || stripos($e->getMessage(), 'Duplicate') !== false) {
        $selectSql = 'SELECT id, status FROM users WHERE email = :email LIMIT 1';
        $sel = $pdo->prepare($selectSql);
        $sel->execute([':email' => $email]);
        $existing = $sel->fetch();

        if (!$existing) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email already exists']);
            exit;
        }

        if ($existing['status'] === 'verified') {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email already registered and verified']);
            exit;
        }

        $updateSql = 'UPDATE users
                      SET name = :name,
                          password_hash = :password_hash,
                          verification_code = :code,
                          verification_expires_at = :expires_at,
                          status = :status,
                          updated_at = NOW()
                      WHERE email = :email';
        $upd = $pdo->prepare($updateSql);
        $upd->execute([
            ':name' => $name,
            ':password_hash' => $passwordHash,
            ':code' => $verificationCode,
            ':expires_at' => $expiresAt,
            ':status' => 'unverified',
            ':email' => $email,
        ]);
        $createdNew = false;
    } else {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save user']);
        exit;
    }
}

// --------------------------- Send Email via Resend.com ----------------------
// Send verification email using Resend API (works without Composer/SDK)
try {
    // Prepare email payload for Resend API
    $payload = [
        'from' => $resendFromEmail,
        'to' => $email, // Email from registration form
        'subject' => 'Verify your AutoWash Hub account',
        'html' => '<p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">' . htmlspecialchars($verificationCode) . '</strong></p><p>This code expires in 10 minutes.</p>',
        'text' => 'Your verification code is: ' . $verificationCode . "\n\nThis code expires in 10 minutes."
    ];
    
    // Send via Resend API using cURL (no SDK required)
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
    
    // Handle errors
    if ($curlError) {
        throw new \Exception('Connection error: ' . $curlError);
    }
    
    $responseData = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        // Success
        error_log("Resend email sent successfully to $email. ID: " . ($responseData['id'] ?? 'unknown'));
    } else {
        // API error
        $errorMsg = $responseData['message'] ?? 'Unknown error';
        if (isset($responseData['errors'])) {
            $errorMsg .= ' - ' . json_encode($responseData['errors']);
        }
        throw new \Exception($errorMsg);
    }
    
} catch (\Exception $e) {
    $pdo->rollBack();
    error_log('Resend email exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Failed to send email: ' . $e->getMessage(),
        'debug' => $appEnv === 'development' ? [
            'message' => $e->getMessage()
        ] : null
    ]);
    exit;
}

$pdo->commit();

echo json_encode([
    'success' => true,
    'message' => $createdNew ? 'User created. Verification email sent.' : 'User updated. Verification email sent.',
    'email' => $email,
    'expires_at' => $expiresAt,
    // Include code for testing only - remove in production
    'code' => $appEnv === 'development' ? $verificationCode : null
]);

// --------------------------- Example SQL (run once) --------------------------
// Suggested MySQL schema:
//
// CREATE TABLE IF NOT EXISTS users (
//   id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(255) NOT NULL,
//   email VARCHAR(255) NOT NULL UNIQUE,
//   password_hash VARCHAR(255) NOT NULL,
//   verification_code VARCHAR(6) DEFAULT NULL,
//   verification_expires_at DATETIME DEFAULT NULL,
//   status ENUM('unverified','verified') NOT NULL DEFAULT 'unverified',
//   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
?>


