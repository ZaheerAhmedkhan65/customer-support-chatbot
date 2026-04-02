const pool = require('../config/database');

async function createSubscriptionTables() {
    try {
        console.log('Creating subscription tables...');

        // Create subscriptions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                subscription_id VARCHAR(100) UNIQUE NOT NULL,
                plan_id ENUM('free', 'professional', 'enterprise') NOT NULL DEFAULT 'free',
                status ENUM('active', 'canceled', 'past_due', 'incomplete') NOT NULL DEFAULT 'active',
                current_period_start DATETIME NOT NULL,
                current_period_end DATETIME NOT NULL,
                canceled_at DATETIME DEFAULT NULL,
                cancel_at_period_end BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_status (user_id, status),
                INDEX idx_subscription_id (subscription_id),
                INDEX idx_period_end (current_period_end)
            )
        `);

        console.log('✓ Subscriptions table created');

        // Create usage_tracking table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS usage_tracking (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                chatbot_id INT DEFAULT NULL,
                session_id VARCHAR(255) DEFAULT NULL,
                usage_type ENUM('conversation', 'api_call', 'knowledge_item') NOT NULL DEFAULT 'conversation',
                tokens_used INT DEFAULT 0,
                metadata JSON DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE SET NULL,
                INDEX idx_user_type_date (user_id, usage_type, created_at),
                INDEX idx_chatbot_date (chatbot_id, created_at),
                INDEX idx_session (session_id)
            )
        `);

        console.log('✓ Usage tracking table created');

        // Insert default free subscriptions for existing users without one
        await pool.execute(`
            INSERT INTO subscriptions (user_id, subscription_id, plan_id, status, current_period_start, current_period_end)
            SELECT 
                u.id,
                CONCAT('sub_', UNIX_TIMESTAMP(), '_', u.org_id),
                'free',
                'active',
                NOW(),
                DATE_ADD(NOW(), INTERVAL 1 MONTH)
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
            WHERE s.id IS NULL
        `);

        console.log('✓ Default subscriptions created for existing users');

        console.log('Subscription tables setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating subscription tables:', error);
        process.exit(1);
    }
}

createSubscriptionTables();