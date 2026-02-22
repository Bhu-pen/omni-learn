<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'omni_user');
define('DB_PASS', 'password123');
define('DB_NAME', 'omni_learn');

// OpenRouter / DeepSeek Configuration
define('OPENROUTER_API_KEY', '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');
define('AI_MODEL', 'deepseek/deepseek-r1-0528:free');

// Connect to Database
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
    }
    return $conn;
}
?>
