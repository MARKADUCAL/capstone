-- SQL script to add is_approved column to employees table
-- Run this script to enable the employee approval feature

-- Check if column already exists before adding
-- If you get an error that the column already exists, you can skip this step
ALTER TABLE employees 
ADD COLUMN is_approved TINYINT(1) DEFAULT 0 NOT NULL 
COMMENT '0 = pending approval, 1 = approved';

-- Update existing employees to be approved by default
-- This ensures all current employees can login immediately
UPDATE employees SET is_approved = 1;

-- After running this, new employee registrations will be set to is_approved = 0 (pending)
-- and will need admin approval before they can login

