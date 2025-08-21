-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 15, 2025 at 10:54 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_autowashhub`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `admin_id` varchar(20) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `admin_id`, `first_name`, `last_name`, `email`, `phone`, `password`, `created_at`) VALUES
(1, 'ADM-001', 'Admin', 'User', 'admin@autowashhub.com', '09123456789', '$2y$10$RF.PHRUGWWTfNynCYfBhzOUHOkrZy818JftyRVLmpCy/oPnO0mQKu', '2025-05-08 03:00:00'),
(2, 'ADM-003', 'admin', 'admin', 'admin123@gmail.com', '09123456789', '$2y$10$UkqKL9n31SQix0fJL1uAUuQ9.3RaCEC7cLRebGi1xy9YOJNwvOJf6', '2025-05-08 09:52:39');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `email`, `phone`, `password`, `created_at`) VALUES
(1, 'Test', 'User', 'test@example.com', '1234567890', 'hashedpassword123', '2025-04-02 06:21:55'),
(2, 'mark', 'aducal', 'aducalremegio03@gmail.com', '09054475122', '$2y$10$RF.PHRUGWWTfNynCYfBhzOUHOkrZy818JftyRVLmpCy/oPnO0mQKu', '2025-05-08 02:56:15'),
(3, '123', '123', '123@gmail.com', '09054475122', '$2y$10$/j0TQKu9wOgzJqOKFddWOOdKYrfCIQoPn/uwAbLqEkpsmN2UQmmNu', '2025-05-09 10:17:23'),
(4, 'qwe', 'qwe', 'qwe123@gmail.com', '09054475122', '$2y$10$vAB2dRNovNaJSzdBsKcOHOLUSBWFIyRb4lPQUjVBWfPUwOBJtV1Ji', '2025-05-14 16:54:47'),
(5, 'asd', 'asd', 'asd123@gmail.com', '09054475122', '$2y$10$eKorIAuHgcG4vu/2c0ddVOLa3MnnOoGwvQ6I7OcUsd.uK4FZg3qcy', '2025-05-14 16:56:23');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employee_id`, `first_name`, `last_name`, `email`, `phone`, `password`, `position`, `created_at`) VALUES
(1, 'EMP-001', 'John', 'Doe', 'john@example.com', '1234567890', 'hashedpassword', 'Car Washer', '2025-03-12 05:21:07'),
(2, 'EMP-003', 'employee', 'employee', 'employee1@gmail.com', '09054475122', '$2y$10$gYIQBDJnTwJSBMlnF/MCbe/0sMQdZgN3dGTavsO69uIivz3QyNLlS', 'washer', '2025-05-08 16:11:34');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT 'General',
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `image_url` varchar(500) DEFAULT NULL,
  `min_stock_level` int(11) NOT NULL DEFAULT 5,
  `supplier` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT 'Main Storage',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `name`, `description`, `category`, `stock_quantity`, `price`, `image_url`, `min_stock_level`, `supplier`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Car Shampoo', 'Premium car wash shampoo for all vehicle types', 'Cleaning Supplies', 25, 19.99, 'assets/images/car-shampoo.jpg', 10, 'AutoCare Supplies', 'Main Storage', 1, '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
(2, 'Microfiber Towels', 'High-quality microfiber towels for drying vehicles', 'Cleaning Supplies', 50, 12.99, 'assets/images/microfiber-towels.jpg', 15, 'AutoCare Supplies', 'Main Storage', 1, '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
(3, 'Tire Shine', 'Professional tire shine and protectant', 'Car Care Products', 30, 15.99, 'assets/images/tire-shine.jpg', 8, 'AutoCare Supplies', 'Main Storage', 1, '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
(4, 'Wheel Cleaner', 'Heavy-duty wheel cleaner for all wheel types', 'Cleaning Supplies', 20, 22.99, 'assets/images/wheel-cleaner.jpg', 5, 'AutoCare Supplies', 'Main Storage', 1, '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
(5, 'Interior Cleaner', 'Multi-surface interior cleaner and protectant', 'Car Care Products', 18, 18.99, 'assets/images/interior-cleaner.jpg', 8, 'AutoCare Supplies', 'Main Storage', 1, '2025-01-15 10:00:00', '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_history`
--

CREATE TABLE `inventory_history` (
  `id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `action_type` enum('ADDED','ADD','REMOVE','SET','ADJUSTED') NOT NULL,
  `quantity_changed` int(11) NOT NULL,
  `previous_quantity` int(11) NOT NULL,
  `new_quantity` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_history`
--

INSERT INTO `inventory_history` (`id`, `inventory_id`, `action_type`, `quantity_changed`, `previous_quantity`, `new_quantity`, `notes`, `employee_id`, `action_date`) VALUES
(1, 1, 'ADDED', 25, 0, 25, 'Initial stock added', 1, '2025-01-15 10:00:00'),
(2, 2, 'ADDED', 50, 0, 50, 'Initial stock added', 1, '2025-01-15 10:00:00'),
(3, 3, 'ADDED', 30, 0, 30, 'Initial stock added', 1, '2025-01-15 10:00:00'),
(4, 4, 'ADDED', 20, 0, 20, 'Initial stock added', 1, '2025-01-15 10:00:00'),
(5, 5, 'ADDED', 18, 0, 18, 'Initial stock added', 1, '2025-01-15 10:00:00'),
(6, 1, 'REMOVE', 2, 25, 23, 'Used for car wash service', 2, '2025-01-16 14:30:00'),
(7, 2, 'REMOVE', 3, 50, 47, 'Used for car wash service', 2, '2025-01-16 15:45:00'),
(8, 1, 'ADD', 10, 23, 33, 'Restocked from supplier', 1, '2025-01-17 09:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `price`, `duration_minutes`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(2, '123', '123', 123.00, 123, 'Basic Wash', 1, '2025-06-14 05:46:01', '2025-06-14 05:50:44'),
(3, 'basic ', 'a lot of e', 123.00, 123, 'Basic Wash', 1, '2025-06-14 11:18:43', '2025-06-14 11:18:43');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `vehicle_type` varchar(100) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `wash_date` date NOT NULL,
  `wash_time` time NOT NULL,
  `payment_type` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('Pending','Confirmed','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `customer_id`, `service_id`, `vehicle_type`, `nickname`, `phone`, `wash_date`, `wash_time`, `payment_type`, `price`, `status`, `notes`) VALUES
(1, 1, 2, 'Sedan', 'Test Car', '1234567890', '2025-01-20', '10:00:00', 'Cash', 123.00, 'Pending', 'Please be gentle with the paint'),
(2, 2, 3, 'SUV', 'Mark\'s SUV', '09054475122', '2025-01-21', '14:30:00', 'Credit Card', 123.00, 'Confirmed', 'Interior needs extra attention'),
(3, 3, 2, 'Truck', '123 Truck', '09054475122', '2025-01-22', '09:00:00', 'Cash', 123.00, 'Pending', 'First time customer');

-- --------------------------------------------------------

--
-- Table structure for table `booking_history`
--

CREATE TABLE `booking_history` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `status_from` varchar(50) DEFAULT NULL,
  `status_to` varchar(50) NOT NULL,
  `changed_by` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_history`
--

INSERT INTO `booking_history` (`id`, `booking_id`, `status_from`, `status_to`, `changed_by`, `notes`, `created_at`) VALUES
(1, 1, 'Pending', 'Confirmed', 'admin@autowashhub.com', 'Booking confirmed by admin', '2025-01-19 15:30:00'),
(2, 2, 'Pending', 'Confirmed', 'admin@autowashhub.com', 'Customer requested confirmation', '2025-01-20 10:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `time_slots`
--

CREATE TABLE `time_slots` (
  `id` int(11) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_bookings` int(11) NOT NULL DEFAULT 3,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `time_slots`
--

INSERT INTO `time_slots` (`id`, `start_time`, `end_time`, `max_bookings`, `is_active`, `created_at`) VALUES
(1, '08:00:00', '09:00:00', 3, 1, '2025-01-15 10:00:00'),
(2, '09:00:00', '10:00:00', 3, 1, '2025-01-15 10:00:00'),
(3, '10:00:00', '11:00:00', 3, 1, '2025-01-15 10:00:00'),
(4, '11:00:00', '12:00:00', 3, 1, '2025-01-15 10:00:00'),
(5, '13:00:00', '14:00:00', 3, 1, '2025-01-15 10:00:00'),
(6, '14:00:00', '15:00:00', 3, 1, '2025-01-15 10:00:00'),
(7, '15:00:00', '16:00:00', 3, 1, '2025-01-15 10:00:00'),
(8, '16:00:00', '17:00:00', 3, 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_types`
--

CREATE TABLE `vehicle_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price_multiplier` decimal(3,2) NOT NULL DEFAULT 1.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicle_types`
--

INSERT INTO `vehicle_types` (`id`, `name`, `description`, `base_price_multiplier`, `is_active`, `created_at`) VALUES
(1, 'Sedan', 'Small to medium sized cars', 1.00, 1, '2025-01-15 10:00:00'),
(2, 'SUV', 'Sport Utility Vehicles', 1.25, 1, '2025-01-15 10:00:00'),
(3, 'Truck', 'Pickup trucks and large vehicles', 1.50, 1, '2025-01-15 10:00:00'),
(4, 'Van', 'Minivans and cargo vans', 1.35, 1, '2025-01-15 10:00:00'),
(5, 'Motorcycle', 'Motorcycles and scooters', 0.75, 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Cash', 'Cash payment', 1, '2025-01-15 10:00:00'),
(2, 'Credit Card', 'Credit or debit card payment', 1, '2025-01-15 10:00:00'),
(3, 'Digital Wallet', 'Mobile payment apps', 1, '2025-01-15 10:00:00'),
(4, 'Bank Transfer', 'Direct bank transfer', 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`id`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Basic Wash', 'Basic exterior cleaning services', 1, '2025-01-15 10:00:00'),
(2, 'Premium Wash', 'Enhanced cleaning with additional services', 1, '2025-01-15 10:00:00'),
(3, 'Full Detail', 'Complete interior and exterior detailing', 1, '2025-01-15 10:00:00'),
(4, 'Express Wash', 'Quick cleaning services', 1, '2025-01-15 10:00:00'),
(5, 'Specialty Services', 'Specialized cleaning services', 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `customer_feedback`
--

CREATE TABLE `customer_feedback` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `rating` int(1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_feedback`
--

INSERT INTO `customer_feedback` (`id`, `booking_id`, `customer_id`, `rating`, `comment`, `is_public`, `created_at`) VALUES
(1, 2, 2, 5, 'Excellent service! Very professional and thorough.', 1, '2025-01-21 16:00:00'),
(2, 1, 1, 4, 'Good service, but took longer than expected.', 1, '2025-01-20 12:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `employee_schedules`
--

CREATE TABLE `employee_schedules` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_schedules`
--

INSERT INTO `employee_schedules` (`id`, `employee_id`, `work_date`, `start_time`, `end_time`, `is_available`, `created_at`) VALUES
(1, 1, '2025-01-20', '08:00:00', '17:00:00', 1, '2025-01-15 10:00:00'),
(2, 1, '2025-01-21', '08:00:00', '17:00:00', 1, '2025-01-15 10:00:00'),
(3, 2, '2025-01-20', '09:00:00', '18:00:00', 1, '2025-01-15 10:00:00'),
(4, 2, '2025-01-21', '09:00:00', '18:00:00', 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_percentage` decimal(5,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `name`, `description`, `discount_percentage`, `start_date`, `end_date`, `is_active`, `created_at`) VALUES
(1, 'New Customer Discount', '20% off for first-time customers', 20.00, '2025-01-01', '2025-12-31', 1, '2025-01-15 10:00:00'),
(2, 'Weekend Special', '15% off all services on weekends', 15.00, '2025-01-01', '2025-12-31', 1, '2025-01-15 10:00:00'),
(3, 'Bulk Booking Discount', '10% off when booking 3 or more services', 10.00, '2025-01-01', '2025-12-31', 1, '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `booking_promotions`
--

CREATE TABLE `booking_promotions` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `promotion_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_promotions`
--

INSERT INTO `booking_promotions` (`id`, `booking_id`, `promotion_id`, `discount_amount`, `created_at`) VALUES
(1, 1, 1, 24.60, '2025-01-19 15:30:00'),
(2, 2, 2, 18.45, '2025-01-20 10:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` enum('customer','employee','admin') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `user_type`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 1, 'customer', 'Booking Confirmed', 'Your booking for January 20th at 10:00 AM has been confirmed.', 'success', 0, '2025-01-19 15:30:00'),
(2, 2, 'customer', 'Booking Confirmed', 'Your booking for January 21st at 2:30 PM has been confirmed.', 'success', 0, '2025-01-20 10:15:00'),
(3, 1, 'admin', 'New Booking', 'New booking received from Test User for January 20th.', 'info', 0, '2025-01-19 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'business_hours_start', '08:00:00', 'Business opening time', '2025-01-15 10:00:00'),
(2, 'business_hours_end', '18:00:00', 'Business closing time', '2025-01-15 10:00:00'),
(3, 'max_bookings_per_slot', '3', 'Maximum bookings allowed per time slot', '2025-01-15 10:00:00'),
(4, 'advance_booking_days', '30', 'How many days in advance customers can book', '2025-01-15 10:00:00'),
(5, 'cancellation_hours', '24', 'Hours before appointment when cancellation is allowed', '2025-01-15 10:00:00'),
(6, 'tax_rate', '12.00', 'Tax rate percentage', '2025-01-15 10:00:00');

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_id` (`admin_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `status` (`status`),
  ADD KEY `wash_date` (`wash_date`);

--
-- Indexes for table `booking_history`
--
ALTER TABLE `booking_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `booking_promotions`
--
ALTER TABLE `booking_promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `promotion_id` (`promotion_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `customer_feedback`
--
ALTER TABLE `customer_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `work_date` (`work_date`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_history`
--
ALTER TABLE `inventory_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_id` (`inventory_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `user_type` (`user_type`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `time_slots`
--
ALTER TABLE `time_slots`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicle_types`
--
ALTER TABLE `vehicle_types`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `booking_history`
--
ALTER TABLE `booking_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `booking_promotions`
--
ALTER TABLE `booking_promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customer_feedback`
--
ALTER TABLE `customer_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory_history`
--
ALTER TABLE `inventory_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vehicle_types`
--
ALTER TABLE `vehicle_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_history`
--
ALTER TABLE `booking_history`
  ADD CONSTRAINT `fk_booking_history_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_promotions`
--
ALTER TABLE `booking_promotions`
  ADD CONSTRAINT `fk_booking_promotions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_booking_promotions_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_feedback`
--
ALTER TABLE `customer_feedback`
  ADD CONSTRAINT `fk_customer_feedback_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_customer_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD CONSTRAINT `fk_employee_schedules_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_history`
--
ALTER TABLE `inventory_history`
  ADD CONSTRAINT `fk_inventory_history_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

COMMIT;
