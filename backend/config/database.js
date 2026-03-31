const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Database initialization
const initDatabase = async () => {
    try {
        // Create users table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create chatbots table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS chatbots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                business_name VARCHAR(255),
                business_email VARCHAR(255),
                business_logo TEXT,
                theme_color VARCHAR(7) DEFAULT '#3B82F6',
                button_position ENUM('left', 'right') DEFAULT 'right',
                welcome_message VARCHAR(500) NOT NULL DEFAULT 'Hello! How can I help you today?',                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create knowledge_base table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chatbot_id INT NOT NULL,
                content_type ENUM('faq', 'policy', 'delivery', 'refund', 'product', 'general') DEFAULT 'general',
                question TEXT,
                answer TEXT,
                keywords TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
            )
        `);

        // Create conversations table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chatbot_id INT NOT NULL,
                session_id VARCHAR(255),
                user_message TEXT,
                bot_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
            )
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

module.exports = { pool: promisePool, initDatabase };