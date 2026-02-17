CREATE DATABASE IF NOT EXISTS digital_queue;
USE digital_queue;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'staff') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens (
    id VARCHAR(255) PRIMARY KEY,
    number VARCHAR(20) NOT NULL,
    deptId VARCHAR(50) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    type ENUM('regular', 'emergency', 'disabled') DEFAULT 'regular',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('waiting', 'serving', 'done', 'cancelled') DEFAULT 'waiting',
    counter VARCHAR(10),
    userId VARCHAR(255),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Note: In a real app, history is just a query on tokens for a userId.
-- No need for a separate history table unless we want to archive.

-- Sample Data
INSERT INTO users (id, name, email, password, role) 
VALUES ('staff-99', 'Admin Manager', 'admin@staff.com', 'admin123', 'staff')
ON DUPLICATE KEY UPDATE name=name;
