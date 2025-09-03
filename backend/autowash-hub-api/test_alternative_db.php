<?php
// Test Alternative Database Servers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'alternative_servers' => []
];

// Common Hostinger database server patterns
$alternative_servers = [
    'sql.brown-octopus-872555.hostingersite.com',
    'mysql.brown-octopus-872555.hostingersite.com',
    'db.brown-octopus-872555.hostingersite.com',
    'localhost',
    '127.0.0.1'
];

foreach ($alternative_servers as $server) {
    $test_result = [
        'server' => $server,
        'dns_resolution' => 'unknown',
        'port_3306' => 'unknown',
        'port_3307' => 'unknown'
    ];
    
    // Test DNS resolution
    $ip = gethostbyname($server);
    if ($ip !== $server) {
        $test_result['dns_resolution'] = "success ($ip)";
        
        // Test port 3306
        $connection = @fsockopen($server, 3306, $errno, $errstr, 3);
        if ($connection) {
            $test_result['port_3306'] = 'open';
            fclose($connection);
        } else {
            $test_result['port_3306'] = "closed ($errstr)";
        }
        
        // Test port 3307 (alternative MySQL port)
        $connection = @fsockopen($server, 3307, $errno, $errstr, 3);
        if ($connection) {
            $test_result['port_3307'] = 'open';
            fclose($connection);
        } else {
            $test_result['port_3307'] = "closed ($errstr)";
        }
    } else {
        $test_result['dns_resolution'] = 'failed';
    }
    
    $response['alternative_servers'][] = $test_result;
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>

