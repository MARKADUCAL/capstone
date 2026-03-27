-- SQL code to insert homebackground.png for landing page hero section
-- This assumes the image will be uploaded to the uploads/ folder

-- Option 1: Insert into landing_page_media table (recommended for media management)
INSERT INTO `landing_page_media` (`media_key`, `file_path`, `alt_text`, `created_at`)
VALUES (
    'hero_background',
    'uploads/homebackground.png',
    'Background image for the hero section showing car washing process',
    NOW()
);

-- Option 2: Update the existing hero section content to use the new uploads path
UPDATE `landing_page_content` 
SET `content_data` = JSON_SET(
    `content_data`, 
    '$.background_url', 
    'uploads/homebackground.png'
)
WHERE `section_name` = 'hero';

-- Option 3: If you want to completely replace the hero section data
-- (Uncomment this if you want to replace the entire hero section)
/*
UPDATE `landing_page_content` 
SET `content_data` = JSON_OBJECT(
    'title', 'CARWASHING MADE EASY',
    'description', 'AutoWash Hub is one of the most convenient indoor, in-bay, and outdoor carwash specialists offering quality services including body wash, interior vacuum, and more.',
    'background_url', 'uploads/homebackground.png'
)
WHERE `section_name` = 'hero';
*/

-- Verify the changes
SELECT * FROM `landing_page_media` WHERE `media_key` = 'hero_background';
SELECT `section_name`, `content_data` FROM `landing_page_content` WHERE `section_name` = 'hero';


