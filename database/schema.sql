-- Database Schema for Video Rewards Rwanda

CREATE DATABASE IF NOT EXISTS video_rewards_rwanda;
USE video_rewards_rwanda;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    account_type ENUM('free', 'premium') DEFAULT 'free',
    referral_code VARCHAR(20) UNIQUE,
    referred_by INT,
    points INT DEFAULT 0,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_earned DECIMAL(10, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone_number),
    INDEX idx_referral_code (referral_code)
);

-- Videos Table
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    advertiser_id INT,
    category VARCHAR(50),
    duration_seconds INT NOT NULL,
    reward_points INT DEFAULT 10,
    reward_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_views INT DEFAULT 1000,
    current_views INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

-- Video Views Table
CREATE TABLE IF NOT EXISTS video_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watch_duration INT NOT NULL,
    earned_points INT DEFAULT 0,
    earned_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_video (user_id, video_id),
    INDEX idx_user_id (user_id),
    INDEX idx_video_id (video_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('registration', 'referral_bonus', 'video_reward', 'withdrawal', 'admin_credit', 'admin_debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(20),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('mtn_momo', 'airtel_money') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    reference VARCHAR(100),
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Referral Earnings Table
CREATE TABLE IF NOT EXISTS referral_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referee_id INT NOT NULL,
    level INT DEFAULT 1,
    points_earned INT DEFAULT 0,
    amount_earned DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referee_id (referee_id)
);

-- Companies Table (advertisers)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(30),
    website VARCHAR(200),
    logo_url VARCHAR(500),
    description TEXT,
    contact_person VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_name (name),
    INDEX idx_company_active (is_active)
);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description)
VALUES 
('registration_fee', '4750', 'Registration fee in FRW'),
('referral_bonus_points', '50', 'Points earned per referral'),
('referral_level_1_percent', '10', 'Percentage earned from level 1 referrals'),
('referral_level_2_percent', '5', 'Percentage earned from level 2 referrals'),
('minimum_withdrawal', '2000', 'Minimum withdrawal amount in FRW'),
('video_completion_percent', '90', 'Minimum video completion percentage to earn rewards'),
('conversion_rate', '1', 'Points to FRW conversion rate');
