<?php
/**
 * Rate Limiter Middleware
 *
 * File-based sliding window rate limiter for shared hosting environments.
 * Stores request timestamps per IP in JSON files under a rate_limit_data dir.
 *
 * Configuration:
 * - DEFAULT_LIMIT: max requests per window
 * - DEFAULT_WINDOW: window size in seconds
 * - CLEANUP_PROBABILITY: chance of stale-file cleanup on each check
 */

// Tune these per your hosting capacity
define('RATE_LIMIT_DEFAULT_LIMIT', 60);         // max requests per window
define('RATE_LIMIT_DEFAULT_WINDOW', 60);        // window in seconds (1 min)
define('RATE_LIMIT_ADMIN_LIMIT', 120);           // authenticated admins get more
define('RATE_LIMIT_CLEANUP_PROBABILITY', 0.1);  // 10% chance of stale cleanup

/**
 * Get a safe client identifier (IP address)
 */
function rateLimitGetClientIP(): string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $forwardedKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP'];

    foreach ($forwardedKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ips = array_map('trim', explode(',', $_SERVER[$key]));
            if (!empty($ips[0]) && filter_var($ips[0], FILTER_VALIDATE_IP)) {
                return $ips[0];
            }
        }
    }

    // Fallback to REMOTE_ADDR
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // Sanitize
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

/**
 * Get the data directory for rate limit files
 */
function rateLimitGetDataDir(): string {
    $dir = __DIR__ . '/rate_limit_data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

/**
 * Load rate limit data for a client from file
 */
function rateLimitLoadData(string $clientKey): array {
    $dataDir = rateLimitGetDataDir();
    $file = $dataDir . '/' . md5($clientKey) . '.json';

    if (!file_exists($file)) {
        return ['requests' => []];
    }

    $content = file_get_contents($file);
    if ($content === false) {
        return ['requests' => []];
    }

    $data = json_decode($content, true);
    if (!is_array($data) || !isset($data['requests'])) {
        return ['requests' => []];
    }

    return $data;
}

/**
 * Save rate limit data for a client to file
 */
function rateLimitSaveData(string $clientKey, array $data): void {
    $dataDir = rateLimitGetDataDir();
    $file = $dataDir . '/' . md5($clientKey) . '.json';
    file_put_contents($file, json_encode($data), LOCK_EX);
}

/**
 * Check and enforce rate limiting.
 *
 * @param int $limit Max requests allowed in the window.
 * @param int $window Window size in seconds.
 * @return bool True if request is allowed, false if rate limited.
 */
function rateLimitCheck(int $limit = RATE_LIMIT_DEFAULT_LIMIT, int $window = RATE_LIMIT_DEFAULT_WINDOW): bool {
    $ip = rateLimitGetClientIP();
    $now = time();
    $clientKey = 'rl_' . $ip;

    $data = rateLimitLoadData($clientKey);
    $requests = $data['requests'] ?? [];

    // Remove timestamps outside the current window (sliding window)
    $windowStart = $now - $window;
    $requests = array_values(array_filter($requests, function($ts) use ($windowStart) {
        return $ts > $windowStart;
    }));

    if (count($requests) >= $limit) {
        // Rate limit exceeded
        $data['requests'] = $requests;
        rateLimitSaveData($clientKey, $data);

        // Calculate retry-after (seconds until oldest request expires from window)
        $oldestInWindow = min($requests);
        $retryAfter = ($oldestInWindow + $window) - $now;

        header('X-RateLimit-Limit: ' . $limit);
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . ($oldestInWindow + $window));
        header('Retry-After: ' . max(1, $retryAfter));

        http_response_code(429);
        echo json_encode([
            'status' => [
                'remarks' => 'error',
                'message' => 'Too many requests. Please wait ' . max(1, $retryAfter) . ' seconds.'
            ],
            'payload' => null,
            'retry_after' => max(1, $retryAfter)
        ]);
        return false;
    }

    // Request allowed — add this request timestamp
    $requests[] = $now;
    $data['requests'] = $requests;
    rateLimitSaveData($clientKey, $data);

    // Set rate limit headers for successful requests
    $remaining = max(0, $limit - count($requests));
    header('X-RateLimit-Limit: ' . $limit);
    header('X-RateLimit-Remaining: ' . $remaining);
    header('X-RateLimit-Reset: ' . ($now + $window));

    // Periodic cleanup of stale files
    if (mt_rand(1, 100) <= (RATE_LIMIT_CLEANUP_PROBABILITY * 100)) {
        rateLimitCleanup($now, $window);
    }

    return true;
}

/**
 * Cleanup stale rate limit files
 */
function rateLimitCleanup(int $now, int $window): void {
    $dataDir = rateLimitGetDataDir();
    $cutoff = $now - $window;

    if (!is_dir($dataDir)) return;

    $files = glob($dataDir . '/*.json');
    if (!$files) return;

    foreach ($files as $file) {
        $content = file_get_contents($file);
        if ($content === false) continue;

        $data = json_decode($content, true);
        if (!isset($data['requests']) || !is_array($data['requests'])) {
            @unlink($file);
            continue;
        }

        // If all timestamps are stale, delete the file
        $hasRecent = false;
        foreach ($data['requests'] as $ts) {
            if ($ts > $cutoff) {
                $hasRecent = true;
                break;
            }
        }

        if (!$hasRecent) {
            @unlink($file);
        }
    }
}

/**
 * Get rate limit info for the current client (for debugging / endpoints)
 */
function rateLimitGetInfo(int $limit = RATE_LIMIT_DEFAULT_LIMIT, int $window = RATE_LIMIT_DEFAULT_WINDOW): array {
    $ip = rateLimitGetClientIP();
    $now = time();
    $clientKey = 'rl_' . $ip;
    $data = rateLimitLoadData($clientKey);
    $requests = array_values(array_filter($data['requests'] ?? [], function($ts) use ($now, $window) {
        return $ts > ($now - $window);
    }));

    return [
        'ip' => $ip,
        'limit' => $limit,
        'used' => count($requests),
        'remaining' => max(0, $limit - count($requests)),
        'window_seconds' => $window,
        'resets_at' => !empty($requests) ? (min($requests) + $window) : null
    ];
}
