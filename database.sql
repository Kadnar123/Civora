-- phpMyAdmin SQL Dump
-- Civora Platform Database
-- Database: `civora`
CREATE DATABASE IF NOT EXISTS `civora` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `civora`;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255),
  `phone` VARCHAR(20) UNIQUE,
  `email` VARCHAR(255) UNIQUE,
  `password_hash` VARCHAR(255),
  `role` ENUM('Citizen', 'Master Admin', 'Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Citizen',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `report_id` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `status` enum('Pending','In Progress','Resolved') DEFAULT 'Pending',
  `approval_level` ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch',
  `eta_date` DATETIME NULL,
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `department` varchar(100) NOT NULL,
  `photo_base64` LONGTEXT,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `status_text` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
