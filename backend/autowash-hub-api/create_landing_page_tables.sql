-- Landing Page Content Management Database Schema
-- This file creates tables to store dynamic landing page content

-- Table for storing landing page content sections
CREATE TABLE IF NOT EXISTS landing_page_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL UNIQUE,
    content_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for storing uploaded images/media
CREATE TABLE IF NOT EXISTS landing_page_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    section_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default landing page content
INSERT INTO landing_page_content (section_name, content_data) VALUES 
('hero', JSON_OBJECT(
    'title', 'CARWASHING MADE EASY',
    'description', 'AutoWash Hub is one of the most convenient indoor, in-bay, and outdoor carwash specialists offering quality services including body wash, interior vacuum, and more.',
    'background_url', 'assets/homebackground.png'
)),
('services', JSON_ARRAY(
    JSON_OBJECT('name', 'BASIC CAR WASH', 'image_url', 'assets/basiccarwash.png'),
    JSON_OBJECT('name', 'TIRE BLACK', 'image_url', 'assets/tireblack.png'),
    JSON_OBJECT('name', 'BODY WAX', 'image_url', 'assets/bodywax.png'),
    JSON_OBJECT('name', 'VACUUM', 'image_url', 'assets/vacuum.png')
)),
('gallery', JSON_ARRAY(
    JSON_OBJECT('url', 'assets/car1.png', 'alt', 'Car 1'),
    JSON_OBJECT('url', 'assets/car2.png', 'alt', 'Car 2'),
    JSON_OBJECT('url', 'assets/car3.png', 'alt', 'Car 3'),
    JSON_OBJECT('url', 'assets/car4.png', 'alt', 'Car 4'),
    JSON_OBJECT('url', 'assets/car5.png', 'alt', 'Car 5'),
    JSON_OBJECT('url', 'assets/car6.png', 'alt', 'Car 6')
)),
('contact_info', JSON_OBJECT(
    'address', '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
    'opening_hours', 'MON - FRI, 8:00am - 9:00pm',
    'phone', '09123456789',
    'email', 'Example123email.com'
)),
('footer', JSON_OBJECT(
    'address', '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
    'phone', '09123456789',
    'email', 'info@autowashhub.com',
    'copyright', 'AutoWash Hub © 2025. All rights reserved. | Privacy Policy | Terms of Service',
    'facebook', '#',
    'instagram', '#',
    'twitter', '#',
    'tiktok', '#'
))
ON DUPLICATE KEY UPDATE 
content_data = VALUES(content_data),
updated_at = CURRENT_TIMESTAMP;
