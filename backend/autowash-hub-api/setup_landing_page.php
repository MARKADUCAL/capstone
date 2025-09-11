<?php
// Uses existing PDO config to run create_landing_page_tables.sql
require_once __DIR__ . '/api/config/database.php';

header('Content-Type: text/plain');

try {
    $conn = new Connection();
    $pdo = $conn->connect();

    $sqlFile = __DIR__ . '/create_landing_page_tables.sql';
    if (!file_exists($sqlFile)) {
        http_response_code(500);
        echo "SQL file not found: create_landing_page_tables.sql\n";
        exit;
    }

    $sql = file_get_contents($sqlFile);

    // Split by semicolon while keeping MySQL specific statements safe enough for this script
    $statements = array_filter(array_map('trim', explode(';', $sql)), function ($s) {
        return $s !== '';
    });

    $pdo->beginTransaction();
    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }
    $pdo->commit();

    echo "Landing page tables created/verified and default content seeded.\n";

    // Quick verification
    $rows = $pdo->query("SELECT section_name FROM landing_page_content ORDER BY section_name")->fetchAll(PDO::FETCH_COLUMN);
    echo "Sections: " . implode(', ', $rows) . "\n";
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo "Error: " . $e->getMessage() . "\n";
}
?>


