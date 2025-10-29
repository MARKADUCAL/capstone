<?php

class UploadHandler {
    private $pdo;
    private $uploadDir;
    private $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    private $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    public function __construct($pdo) {
        $this->pdo = $pdo;
        // Store uploads under the public web root so they are directly accessible via /uploads/...
        $documentRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
        if (!empty($documentRoot)) {
            $this->uploadDir = $documentRoot . '/uploads/';
        } else {
            // Fallback: relative to project if DOCUMENT_ROOT is not set
            $this->uploadDir = __DIR__ . '/../../uploads/';
        }
    }

    public function sendPayload($data, $status, $message, $code) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }

    public function uploadFile($file, $category = 'general') {
        try {
            // Validate file upload
            if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
                return $this->sendPayload(null, "failed", "No file uploaded or upload error", 400);
            }

            // Validate file size
            if ($file['size'] > $this->maxFileSize) {
                return $this->sendPayload(null, "failed", "File size too large. Maximum 5MB allowed.", 400);
            }

            // Validate file type
            $fileType = mime_content_type($file['tmp_name']);
            if (!in_array($fileType, $this->allowedTypes)) {
                return $this->sendPayload(null, "failed", "Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.", 400);
            }

            // Validate file extension
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($fileExtension, $this->allowedExtensions)) {
                return $this->sendPayload(null, "failed", "Invalid file extension.", 400);
            }

            // Generate unique filename with category prefix
            $fileName = $category . '_' . uniqid() . '_' . time() . '.' . $fileExtension;
            
            // Ensure uploads directory exists
            if (!is_dir($this->uploadDir)) {
                mkdir($this->uploadDir, 0755, true);
            }

            $filePath = $this->uploadDir . $fileName;
            $relativePath = 'uploads/' . $fileName;

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Store file info in database
                $this->storeFileInfo($fileName, $relativePath, $category, $file['size'], $fileType);
                
                return $this->sendPayload([
                    'filename' => $fileName,
                    'filepath' => $relativePath,
                    'url' => $this->getFileUrl($relativePath),
                    'size' => $file['size'],
                    'type' => $fileType,
                    'category' => $category
                ], "success", "File uploaded successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Failed to save file", 500);
            }

        } catch (Exception $e) {
            error_log("Upload error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Upload failed: " . $e->getMessage(), 500);
        }
    }

    public function uploadMultipleFiles($files, $category = 'general') {
        $results = [];
        $errors = [];

        if (!is_array($files['name'])) {
            // Single file
            return $this->uploadFile($files, $category);
        }

        // Multiple files
        $fileCount = count($files['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i]
            ];

            if ($file['error'] === UPLOAD_ERR_OK) {
                $result = $this->uploadFile($file, $category);
                $resultData = json_decode($result, true);
                
                if ($resultData['status'] === 'success') {
                    $results[] = $resultData['data'];
                } else {
                    $errors[] = $file['name'] . ': ' . $resultData['message'];
                }
            } else {
                $errors[] = $file['name'] . ': Upload error';
            }
        }

        return $this->sendPayload([
            'uploaded_files' => $results,
            'errors' => $errors,
            'total_uploaded' => count($results),
            'total_errors' => count($errors)
        ], "success", "Multiple files processed", 200);
    }

    public function deleteFile($filePath) {
        try {
            // Handle both old format (uploads/category/filename) and new format (uploads/filename)
            $fileName = basename($filePath);
            $fullPath = $this->uploadDir . $fileName;
            
            if (file_exists($fullPath)) {
                if (unlink($fullPath)) {
                    // Remove from database
                    $this->removeFileInfo($filePath);
                    return $this->sendPayload(null, "success", "File deleted successfully", 200);
                } else {
                    return $this->sendPayload(null, "failed", "Failed to delete file", 500);
                }
            } else {
                return $this->sendPayload(null, "failed", "File not found", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", "Delete failed: " . $e->getMessage(), 500);
        }
    }

    public function getFileUrl($relativePath) {
        // Always return an API-served URL to avoid static hosting restrictions
        // Detect HTTPS correctly even when behind a proxy/CDN (e.g., Vercel, Cloudflare, Hostinger)
        $protoHeader = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
        if ($protoHeader === '') {
            // Some providers use this JSON header, e.g. {"scheme":"https"}
            $cfVisitor = $_SERVER['HTTP_CF_VISITOR'] ?? '';
            if ($cfVisitor && stripos($cfVisitor, 'https') !== false) {
                $protoHeader = 'https';
            }
        }
        $isHttps = (
            (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
            (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
            (strtolower($protoHeader) === 'https')
        );
        $protocol = $isHttps ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];

        // Determine the api base path robustly across different host setups
        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        // Ensure we always include '/api' even if rewrites make SCRIPT_NAME look like '/index.php'
        if ($scriptDir === '' || $scriptDir === '/' || strpos($scriptDir, '/api') === false) {
            $apiBase = '/api';
        } else {
            $apiBase = $scriptDir;
        }

        $filename = basename($relativePath);
        // Prefer clean path, but some shared hosts (e.g., Hostinger) may not route nested paths correctly.
        // Use the query-style router fallback that our routes.php supports: ?request=file/<filename>
        $cleanUrl = $protocol . '://' . $host . $apiBase . '/file/' . $filename;
        $queryUrl = $protocol . '://' . $host . $apiBase . '/index.php?request=file/' . $filename;
        // Return the query-based URL to maximize compatibility with host routing/WAF rules
        return $queryUrl;
    }

    public function serveFile($filename) {
        $safeName = basename($filename);
        $fullPath = $this->uploadDir . $safeName;

        if (!file_exists($fullPath) || !is_file($fullPath)) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'failed', 'message' => 'File not found']);
            exit();
        }

        // Determine MIME type safely
        $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : false;
        $mime = $finfo ? finfo_file($finfo, $fullPath) : mime_content_type($fullPath);
        if ($finfo) finfo_close($finfo);

        // Only serve image types
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mime, $allowed)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'failed', 'message' => 'Access denied']);
            exit();
        }

        // Stream file
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($fullPath));
        header('Cache-Control: public, max-age=2592000'); // 30 days
        header('X-Content-Type-Options: nosniff');
        readfile($fullPath);
        exit();
    }

    private function storeFileInfo($filename, $filepath, $category, $size, $type) {
        try {
            $sql = "INSERT INTO uploaded_files (filename, filepath, category, size, type, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$filename, $filepath, $category, $size, $type]);
        } catch (Exception $e) {
            // Log error but don't fail the upload
            error_log("Failed to store file info: " . $e->getMessage());
        }
    }

    private function removeFileInfo($filepath) {
        try {
            $sql = "DELETE FROM uploaded_files WHERE filepath = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$filepath]);
        } catch (Exception $e) {
            error_log("Failed to remove file info: " . $e->getMessage());
        }
    }

    public function createUploadedFilesTable() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS uploaded_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(500) NOT NULL,
                category VARCHAR(50) NOT NULL,
                size INT NOT NULL,
                type VARCHAR(100) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_uploaded_at (uploaded_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
            
            $this->pdo->exec($sql);
            return true;
        } catch (Exception $e) {
            error_log("Failed to create uploaded_files table: " . $e->getMessage());
            return false;
        }
    }
}

?>
