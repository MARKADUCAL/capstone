-- Complete setup for hero section background image
-- This script handles both the media registration and content update

-- Step 1: Insert the background image into the media registry
INSERT INTO `landing_page_media` (`media_key`, `file_path`, `alt_text`, `created_at`)
VALUES (
    'hero_background',
    'uploads/homebackground.png',
    'Hero section background image showing car washing process with water droplets and foam',
    NOW()
)
ON DUPLICATE KEY UPDATE
    `file_path` = 'uploads/homebackground.png',
    `alt_text` = 'Hero section background image showing car washing process with water droplets and foam',
    `created_at` = NOW();

-- Step 2: Update the hero section content to use the new background
UPDATE `landing_page_content` 
SET `content_data` = JSON_SET(
    `content_data`, 
    '$.background_url', 
    'uploads/homebackground.png'
)
WHERE `section_name` = 'hero';

-- Step 3: If the hero section doesn't exist, create it
INSERT INTO `landing_page_content` (`section_name`, `content_data`)
SELECT * FROM (
    SELECT 'hero' AS section_name, JSON_OBJECT(
        'title', 'CARWASHING MADE EASY',
        'description', 'AutoWash Hub is one of the most convenient indoor, in-bay, and outdoor carwash specialists offering quality services including body wash, interior vacuum, and more.',
        'background_url', 'uploads/homebackground.png'
    ) AS content_data
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `landing_page_content` WHERE `section_name` = 'hero');

-- Step 4: Verify the setup
SELECT 
    'Media Registry' as table_name,
    media_key,
    file_path,
    alt_text,
    created_at
FROM `landing_page_media` 
WHERE `media_key` = 'hero_background'

UNION ALL

SELECT 
    'Content Data' as table_name,
    section_name as media_key,
    JSON_EXTRACT(content_data, '$.background_url') as file_path,
    JSON_EXTRACT(content_data, '$.title') as alt_text,
    updated_at as created_at
FROM `landing_page_content` 
WHERE `section_name` = 'hero';


