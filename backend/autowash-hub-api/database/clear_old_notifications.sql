-- Clear all old notifications to test the fixed notification system
-- Run this ONCE to remove old buggy notifications

DELETE FROM notifications;

-- Reset auto-increment
ALTER TABLE notifications AUTO_INCREMENT = 1;

-- Verify it's empty
SELECT COUNT(*) as remaining_notifications FROM notifications;
