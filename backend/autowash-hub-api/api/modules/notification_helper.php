<?php

function sendNotification($pdo, $userRole, $userId, $type, $message, $data = []) {
    try {
        $sql = "INSERT INTO notifications (user_role, user_id, type, message, data) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $userRole,
            $userId,
            $type,
            $message,
            json_encode($data)
        ]);
    } catch (Exception $e) {
        error_log('Notification error: ' . $e->getMessage());
        return false;
    }
}
