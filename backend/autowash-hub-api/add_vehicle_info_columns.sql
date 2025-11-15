-- Add vehicle information columns to bookings table
-- Plate Number (required)
-- Vehicle Model (required)
-- Vehicle Color (optional)

ALTER TABLE bookings 
ADD COLUMN plate_number VARCHAR(20) NOT NULL DEFAULT '' AFTER service_package,
ADD COLUMN vehicle_model VARCHAR(50) NOT NULL DEFAULT '' AFTER plate_number,
ADD COLUMN vehicle_color VARCHAR(30) DEFAULT NULL AFTER vehicle_model;

-- Note: After running this migration, you may want to update existing records
-- or remove the DEFAULT values if you want to enforce NOT NULL constraints
-- UPDATE bookings SET plate_number = 'N/A', vehicle_model = 'N/A' WHERE plate_number = '' OR vehicle_model = '';

