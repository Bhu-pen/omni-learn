<?php
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$userName = $data['name'] ?? 'Learner';
$xp = $data['xp'] ?? 0;
$studyTime = $data['totalStudyTime'] ?? 0;

$conn = getDbConnection();

// Find user by name (assuming name is unique for simplicity in this project)
$stmt = $conn->prepare("SELECT id FROM users WHERE name = ? LIMIT 1");
$stmt->bind_param("s", $userName);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if ($user) {
    $userId = $user['id'];
    
    // Check if progress already exists
    $stmt = $conn->prepare("SELECT id FROM user_progress WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $progResult = $stmt->get_result();
    
    if ($progResult->num_rows > 0) {
        // Update
        $stmt = $conn->prepare("UPDATE user_progress SET xp = xp + ?, total_study_time = total_study_time + ? WHERE user_id = ?");
        $stmt->bind_param("iii", $xp, $studyTime, $userId);
    } else {
        // Insert
        $stmt = $conn->prepare("INSERT INTO user_progress (user_id, xp, total_study_time) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $userId, $xp, $studyTime);
    }
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["error" => "User not found"]);
}

$conn->close();
?>
