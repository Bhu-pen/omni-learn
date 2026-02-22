<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(180); // Allow more time for AI reasoning

header('Content-Type: application/json');
require_once 'config.php';

// Check for CURL
if (!function_exists('curl_init')) {
    echo json_encode(['error' => 'CURL PHP extension is not installed. Run: sudo apt install php-curl']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'No PDF file uploaded or upload error.']);
    exit;
}

$tmpFile = $_FILES['pdf']['tmp_name'];
$extractedText = '';

// Use pdftotext to extract text (available on Linux/Ubuntu)
// 2>&1 redirects stderr to stdout so we can see errors
$command = "pdftotext " . escapeshellarg($tmpFile) . " - 2>&1";
$extractedText = shell_exec($command);

if (!$extractedText || strlen(trim($extractedText)) < 10) {
    echo json_encode([
        'error' => 'Could not extract text from the PDF.',
        'debug_command' => $command,
        'debug_output' => substr($extractedText, 0, 100)
    ]);
    exit;
}

// Limit text to avoid token limits (first 4000 chars should be enough for a 5-question quiz)
$summaryText = substr($extractedText, 0, 4000);

$prompt = "Generate exactly 5 multiple choice questions based on the following text.
Return ONLY a valid JSON array of objects.
Each object must have 'question', 'options' (4 strings), and 'answer' (the exact string from options).

TEXT:
$summaryText";

$ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 300); // Massive timeout just in case
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'google/gemini-2.0-flash-lite-001:free', // Using a faster model for PDF
    'messages' => [
        ['role' => 'user', 'content' => $prompt]
    ]
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . OPENROUTER_API_KEY,
    'Content-Type: application/json',
    'HTTP-Referer: http://localhost/omni-learn',
    'X-Title: Omni-Learn'
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
    exit;
}
curl_close($ch);

$result = json_decode($response, true);

if (isset($result['error'])) {
    echo json_encode(['error' => 'OpenRouter Error: ' . ($result['error']['message'] ?? 'Unknown error')]);
    exit;
}

$ai_content = $result['choices'][0]['message']['content'] ?? null;

if (!$ai_content) {
    echo json_encode(['error' => 'AI did not return any content', 'debug' => $response]);
    exit;
}

// Cleaning logic (Sync with generate-quiz.php)
$ai_content = preg_replace('/<think>.*?<\/think>/s', '', $ai_content);
$ai_content = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', $ai_content);
if (preg_match('/\[\s*\{[\s\S]*\}\s*\]/', $ai_content, $matches)) {
    $ai_content = $matches[0];
}

$ai_content = trim($ai_content);
$questions = json_decode($ai_content, true);

if (!$questions) {
    echo json_encode([
        'error' => 'AI returned invalid JSON', 
        'hint' => 'The PDF might be too complex or the AI reached a limit.',
        'debug_snippet' => substr($ai_content, 0, 200) . '...' 
    ]);
    exit;
}

// Optional: Store quiz in database
try {
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if (!$conn->connect_error) {
        $stmt = $conn->prepare("INSERT INTO quizzes (topic, difficulty, questions) VALUES (?, ?, ?)");
        $topic = "PDF Upload: " . $_FILES['pdf']['name'];
        $diff = "Adaptive";
        $json_questions = json_encode($questions);
        $stmt->bind_param("sss", $topic, $diff, $json_questions);
        $stmt->execute();
        $stmt->close();
        $conn->close();
    }
} catch (Exception $e) {}

echo json_encode($questions);
?>
