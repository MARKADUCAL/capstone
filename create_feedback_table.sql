-- Create customer_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS `customer_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `rating` int(1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` text,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `customer_id` (`customer_id`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `fk_feedback_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample feedback data
INSERT INTO `customer_feedback` (`booking_id`, `customer_id`, `rating`, `comment`, `is_public`, `created_at`) VALUES
(1, 1, 5, 'Excellent service! My car looks brand new. Very satisfied with the quality.', 1, NOW()),
(2, 2, 4, 'Good service overall. The staff was friendly and professional.', 1, NOW()),
(3, 3, 3, 'Service was okay, but it took longer than expected.', 0, NOW()),
(4, 4, 5, 'Amazing job! Will definitely come back again.', 1, NOW()),
(5, 5, 4, 'Very good service. The car wash was thorough and clean.', 1, NOW());
