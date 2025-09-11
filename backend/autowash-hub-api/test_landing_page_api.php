<?php
// Simple local test page for landing page endpoints
header('Content-Type: text/html; charset=utf-8');

$base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') .
        '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/api';

function getJson($url) {
    $context = stream_context_create(['http' => ['method' => 'GET']]);
    $res = @file_get_contents($url, false, $context);
    return $res === false ? null : $res;
}

function postJson($url, $data) {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($data)
        ]
    ];
    $context = stream_context_create($opts);
    $res = @file_get_contents($url, false, $context);
    return $res === false ? null : $res;
}

echo "<h1>Landing Page API Tests</h1>";

$getUrl = $base . '/landing_page_content';
echo "<h2>GET /landing_page_content</h2>";
echo '<code>' . htmlspecialchars($getUrl) . '</code>';
$getRes = getJson($getUrl);
echo '<pre>' . htmlspecialchars($getRes ?? 'Request failed') . '</pre>';

$postUrl = $base . '/update_landing_page_content';
echo "<h2>POST /update_landing_page_content</h2>";
echo '<code>' . htmlspecialchars($postUrl) . '</code>';
$sample = [
    'hero' => [
        'title' => 'CARWASHING MADE EASY',
        'description' => 'AutoWash Hub is one of the most convenient car washing service providers at your preferred location.',
        'background_url' => 'assets/homebackground.png'
    ],
    'services' => [
        ['name' => 'Body Wash', 'image_url' => 'assets/basiccarwash.png']
    ],
    'gallery' => [ ['url' => 'assets/car1.png', 'alt' => 'sample'] ],
    'contact_info' => [
        'address' => '123 Auto Street, Car City',
        'opening_hours' => 'Mon-Sun 8:00 AM - 6:00 PM',
        'phone' => '+63 912 345 6789',
        'email' => 'contact@autowashhub.com'
    ],
    'footer' => [
        'address' => '123 Auto Street, Car City',
        'phone' => '+63 912 345 6789',
        'email' => 'support@autowashhub.com',
        'copyright' => '© 2025 AutoWash Hub. All rights reserved.',
        'facebook' => '', 'instagram' => '', 'twitter' => '', 'tiktok' => ''
    ]
];
$postRes = postJson($postUrl, $sample);
echo '<pre>' . htmlspecialchars($postRes ?? 'Request failed') . '</pre>';

echo "<p>If GET failed, run <a href='setup_landing_page.php'>setup_landing_page.php</a> then retry.</p>";


