<?php
header('Content-Type: application/json');
require_once 'config.php';

$conn = getDbConnection();

$sql = "SELECT users.name, user_progress.xp, user_progress.total_study_time 
        FROM user_progress 
        JOIN users ON user_progress.user_id = users.id 
        ORDER BY user_progress.total_study_time DESC LIMIT 10";

$result = $conn->query($sql);

$leaderboard = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $leaderboard[] = $row;
    }
}

echo json_encode($leaderboard);

$conn->close();
?>
