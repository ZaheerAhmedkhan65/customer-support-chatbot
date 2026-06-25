-- Create api_keys table for storing API keys with rotation support
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service VARCHAR(50) NOT NULL,
    key_value TEXT NOT NULL,
    name VARCHAR(255) DEFAULT '',
    is_active TINYINT(1) DEFAULT 1,
    last_used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_active (service, is_active),
    INDEX idx_service_id (service, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;