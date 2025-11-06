<?php
declare(strict_types=1);

// -----------------------------------------------------------------------------
// verify.php
// -----------------------------------------------------------------------------
// Purpose:
// - Accepts POST { email, code }
// - Confirms the code matches and is not expired
// - If valid, updates the user status to 'verified' and clears the code fields
// - Returns JSON with success or error details
// -----------------------------------------------------------------------------

header('Content-Type: application/json');

// --------------------------- Configuration -----------------------------------
// Prefer environment variables; fallback to placeholders for local dev.
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbName = getenv('DB_NAME') ?: 'autowash_hub';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbCharset = 'utf8mb4';

// --------------------------- Input Validation --------------------------------
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

$email = isset($data['email']) ? trim((string)$data['email']) : '';
$code = isset($data['code']) ? trim((string)$data['code']) : '';

if ($email === '' || $code === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: email, code']);
    exit;
}

if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid code format']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}

// --------------------------- DB Connection -----------------------------------
$dsn = "mysql:host={$dbHost};dbname={$dbName};charset={$dbCharset}";
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit;
}

// --------------------------- Verification Logic ------------------------------
$selectSql = 'SELECT id, verification_code, verification_expires_at, status
              FROM users
              WHERE email = :email
              LIMIT 1';
$stmt = $pdo->prepare($selectSql);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

if ($user['status'] === 'verified') {
    echo json_encode(['success' => true, 'message' => 'Already verified']);
    exit;
}

if ($user['verification_code'] !== $code) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Incorrect code']);
    exit;
}

$now = new DateTimeImmutable('now');
$expiresAt = $user['verification_expires_at'] ? new DateTimeImmutable($user['verification_expires_at']) : null;
if ($expiresAt === null || $now > $expiresAt) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Code expired']);
    exit;
}

$updateSql = 'UPDATE users
              SET status = :status,
                  verification_code = NULL,
                  verification_expires_at = NULL,
                  updated_at = NOW()
              WHERE id = :id';
$upd = $pdo->prepare($updateSql);
$upd->execute([
    ':status' => 'verified',
    ':id' => $user['id'],
]);

echo json_encode(['success' => true, 'message' => 'Verification successful']);
?>


