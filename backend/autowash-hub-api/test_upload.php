<?php
// Test file for upload functionality
require_once "./api/config/database.php";
require_once "./api/modules/upload.php";

// Test database connection
try {
    $connection = new Connection();
    $pdo = $connection->connect();
    echo "Database connection successful!\n";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    exit();
}

// Test upload handler initialization
try {
    $uploadHandler = new UploadHandler($pdo);
    echo "Upload handler initialized successfully!\n";
    
    // Test table creation
    if ($uploadHandler->createUploadedFilesTable()) {
        echo "Uploaded files table created/verified successfully!\n";
    } else {
        echo "Failed to create uploaded files table!\n";
    }
    
} catch (Exception $e) {
    echo "Upload handler initialization failed: " . $e->getMessage() . "\n";
}

// Test uploads directory structure
$baseDir = __DIR__ . '/uploads/';

echo "\nChecking upload directory:\n";
if (is_dir($baseDir)) {
    echo "✓ Uploads directory exists\n";
    if (is_writable($baseDir)) {
        echo "  ✓ Uploads directory is writable\n";
    } else {
        echo "  ✗ Uploads directory is not writable\n";
    }
} else {
    echo "✗ Uploads directory does not exist\n";
}

// Test .htaccess file
$htaccessPath = $baseDir . '.htaccess';
if (file_exists($htaccessPath)) {
    echo "\n✓ .htaccess file exists in uploads directory\n";
} else {
    echo "\n✗ .htaccess file missing in uploads directory\n";
}

echo "\nUpload functionality test completed!\n";
echo "\nTo test actual file uploads, you can use the following endpoints:\n";
echo "- POST /api/upload_file (single file)\n";
echo "- POST /api/upload_multiple_files (multiple files)\n";
echo "- POST /api/add_inventory_item_with_image (inventory with image)\n";
echo "- DELETE /api/delete_file (delete file)\n";
?>
