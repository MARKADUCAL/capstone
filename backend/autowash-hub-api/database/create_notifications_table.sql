CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_role ENUM('admin', 'customer', 'employee') NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_unread (user_role, user_id, is_read, created_at),
    INDEX idx_notifications_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notifications (user_role, user_id, type, message, data) VALUES
('admin', 1, 'new_booking', 'New booking from Juan Dela Cruz — Premium Wash on 2026-05-28', JSON_OBJECT('booking_id', 1, 'service', 'Premium Wash', 'date', '2026-05-28')),
('customer', 1, 'booking_approved', 'Your booking on 2026-05-28 has been approved! See you at Leydi Boss.', JSON_OBJECT('booking_id', 1, 'date', '2026-05-28')),
('customer', 1, 'booking_rejected', 'Your booking on 2026-05-28 was not approved. Please rebook or contact us.', JSON_OBJECT('booking_id', 1, 'date', '2026-05-28')),
('employee', 1, 'booking_assigned', 'You have a new assignment: Juan Dela Cruz — Premium Wash on 2026-05-28', JSON_OBJECT('booking_id', 1, 'service', 'Premium Wash', 'date', '2026-05-28'));
