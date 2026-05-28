<?php

function sendNotification($pdo, $userRole, $userId, $type, $message, $data = []) {
    try {
        error_log("🔔 sendNotification() called: role={$userRole}, userId={$userId}, type={$type}");
        $sql = "INSERT INTO notifications (user_role, user_id, type, message, data) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $userRole,
            $userId,
            $type,
            $message,
            json_encode($data)
        ]);
        error_log("🔔 sendNotification() result: " . ($result ? 'SUCCESS' : 'FAILED'));
        return $result;
    } catch (Exception $e) {
        error_log('🔔 Notification error: ' . $e->getMessage());
        return false;
    }
}
