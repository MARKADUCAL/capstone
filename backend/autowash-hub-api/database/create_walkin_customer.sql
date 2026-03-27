-- Create a default walk-in customer record
-- This ensures that walk-in bookings have a valid customer_id to reference

INSERT IGNORE INTO customers (id, first_name, last_name, email, phone, password) 
VALUES (999, 'Walk-in', 'Customer', 'walkin@autowash.com', '000-000-0000', 'walkin_password');

-- Note: This customer record is used for all walk-in bookings
-- The password is not used for authentication since walk-in customers don't log in
