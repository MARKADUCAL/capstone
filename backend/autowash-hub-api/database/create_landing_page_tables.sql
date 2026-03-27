-- Landing Page Content Management Schema and Seed Data
-- Creates tables and inserts default content matching the Angular landing page

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Table: landing_page_content
CREATE TABLE IF NOT EXISTS `landing_page_content` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_name` VARCHAR(64) NOT NULL,
  `content_data` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_section_name` (`section_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: media registry for future file uploads
CREATE TABLE IF NOT EXISTS `landing_page_media` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `media_key` VARCHAR(128) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `alt_text` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_media_key` (`media_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default content if not present
INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
  SELECT 'hero' AS section_name, JSON_OBJECT(
    'title', 'CARWASHING MADE EASY',
    'description', 'AutoWash Hub is one of the most convenient car washing service providers at your preferred location.',
    'background_url', 'assets/homebackground.png'
  ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'hero');

INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
  SELECT 'services' AS section_name, JSON_ARRAY(
    JSON_OBJECT('name','Body Wash','image_url','assets/basiccarwash.png'),
    JSON_OBJECT('name','Body Wax','image_url','assets/bodywax.png'),
    JSON_OBJECT('name','Tire Black','image_url','assets/tireblack.png'),
    JSON_OBJECT('name','Vacuum','image_url','assets/vacuum.png')
  ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'services');

INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
  SELECT 'gallery' AS section_name, JSON_ARRAY(
    JSON_OBJECT('url','assets/car1.png','alt','Clean red car'),
    JSON_OBJECT('url','assets/car2.png','alt','Blue sedan polish'),
    JSON_OBJECT('url','assets/car3.png','alt','SUV foam wash'),
    JSON_OBJECT('url','assets/car4.png','alt','Waxing service'),
    JSON_OBJECT('url','assets/car5.png','alt','Interior vacuum'),
    JSON_OBJECT('url','assets/car6.png','alt','Tire shine')
  ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'gallery');

INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
  SELECT 'contact_info' AS section_name, JSON_OBJECT(
    'address', '123 Auto Street, Car City',
    'opening_hours', 'Mon-Sun 8:00 AM - 6:00 PM',
    'phone', '+63 912 345 6789',
    'email', 'contact@autowashhub.com'
  ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'contact_info');

INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
  SELECT 'footer' AS section_name, JSON_OBJECT(
    'address', '123 Auto Street, Car City',
    'phone', '+63 912 345 6789',
    'email', 'support@autowashhub.com',
    'copyright', '© 2025 AutoWash Hub. All rights reserved.',
    'facebook', 'https://facebook.com/autowashhub',
    'instagram', 'https://instagram.com/autowashhub',
    'twitter', 'https://twitter.com/autowashhub',
    'tiktok', 'https://tiktok.com/@autowashhub'
  ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'footer');


