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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image_url` varchar(255) NOT NULL,
  `date_of_input` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `name`, `stock`, `image_url`, `date_of_input`) VALUES
(1, 'Car Shampoo', 5, 'assets/images/car-shampoo.png', '2024-03-20 00:00:00');
