<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
require_once 'config.php';

// Check for CURL
if (!function_exists('curl_init')) {
    echo json_encode(['error' => 'CURL PHP extension is not installed. Run: sudo apt install php-curl']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$topic = $data['topic'] ?? 'General Knowledge';
$difficulty = $data['difficulty'] ?? 'medium';

$prompt = "you are a top class teacher and you have to generate a quiz to test the student about '$topic' with difficulty '$difficulty'. 
Return exactly 5 multiple choice questions in a JSON array format.
Each question must be an object with:
- 'question': The question text
- 'options': An array of 4 strings
- 'answer': The string that is the correct answer from the options array.

Example format:
[
  {
    \"question\": \"What is 2+2?\",
    \"options\": [\"3\", \"4\", \"5\", \"6\"],
    \"answer\": \"4\"
  }
]
Only return the JSON array, no other text.";

$ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => AI_MODEL,
    'messages' => [
        ['role' => 'user', 'content' => $prompt]
    ]
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . OPENROUTER_API_KEY,
    'Content-Type: application/json',
    'HTTP-Referer: http://localhost/omni-learn', // Optional
    'X-Title: Omni-Learn' // Optional
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

// 1. Remove reasoning/thinking blocks (common in DeepSeek-R1)
$ai_content = preg_replace('/<think>.*?<\/think>/s', '', $ai_content);

// 2. Remove markdown code blocks
$ai_content = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', $ai_content);

// 3. If there's still text around the JSON, try to extract just the array part
if (preg_match('/\[\s*\{[\s\S]*\}\s*\]/', $ai_content, $matches)) {
    $ai_content = $matches[0];
}

$ai_content = trim($ai_content);
$questions = json_decode($ai_content, true);

if (!$questions) {
    // If it still fails, let's see what it actually returned
    echo json_encode([
        'error' => 'AI returned invalid JSON', 
        'hint' => 'The AI might be being too talkative. Try again!',
        'debug_snippet' => substr($ai_content, 0, 200) . '...' 
    ]);
    exit;
}

// Optional: Store quiz in database
// We use a try-catch so that if the DB fails, the user still gets their quiz!
try {
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if (!$conn->connect_error) {
        $stmt = $conn->prepare("INSERT INTO quizzes (topic, difficulty, questions) VALUES (?, ?, ?)");
        $json_questions = json_encode($questions);
        $stmt->bind_param("sss", $topic, $difficulty, $json_questions);
        $stmt->execute();
        $stmt->close();
        $conn->close();
    }
} catch (Exception $e) {
    // Silently continue if DB fails - the goal is to show the quiz!
}

echo json_encode($questions);
?>
