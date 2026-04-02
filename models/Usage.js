const pool = require('../config/database');
const Subscription = require('./Subscription');

class Usage {
    /**
     * Record a conversation usage
     */
    static async recordConversation(userId, chatbotId, sessionId) {
        const subscription = await Subscription.findByUserId(userId);
        const limits = subscription ? subscription.plan.limits : Subscription.PLANS.free.limits;
        
        // Check if unlimited
        if (limits.conversationsPerMonth === -1) {
            // Still record for analytics but don't enforce limit
            await pool.execute(
                `INSERT INTO usage_tracking (user_id, chatbot_id, session_id, usage_type, created_at)
                 VALUES (?, ?, ?, 'conversation', NOW())`,
                [userId, chatbotId, sessionId]
            );
            return { success: true, remaining: -1, limited: false };
        }

        // Get current month usage
        const currentUsage = await Usage.getCurrentConversationCount(userId);
        
        if (currentUsage >= limits.conversationsPerMonth) {
            return { 
                success: false, 
                remaining: 0, 
                limited: true,
                limit: limits.conversationsPerMonth,
                used: currentUsage
            };
        }

        // Record the usage
        await pool.execute(
            `INSERT INTO usage_tracking (user_id, chatbot_id, session_id, usage_type, created_at)
             VALUES (?, ?, ?, 'conversation', NOW())`,
            [userId, chatbotId, sessionId]
        );

        return { 
            success: true, 
            remaining: limits.conversationsPerMonth - currentUsage - 1,
            limited: false,
            limit: limits.conversationsPerMonth,
            used: currentUsage + 1
        };
    }

    /**
     * Get current month's conversation count for a user
     */
    static async getCurrentConversationCount(userId) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count FROM usage_tracking 
             WHERE user_id = ? AND usage_type = 'conversation' 
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
             AND created_at < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')`,
            [userId]
        );
        
        return rows[0].count;
    }

    /**
     * Get usage statistics for a user
     */
    static async getUsageStats(userId) {
        const subscription = await Subscription.findByUserId(userId);
        const limits = subscription ? subscription.plan.limits : Subscription.PLANS.free.limits;
        
        // Get current month's conversation count
        const conversationCount = await Usage.getCurrentConversationCount(userId);
        
        // Get knowledge base item count
        const [kbRows] = await pool.execute(
            `SELECT COUNT(*) as count FROM knowledge_base kb
             INNER JOIN chatbots c ON kb.chatbot_id = c.id
             WHERE c.user_id = ?`,
            [userId]
        );
        const knowledgeBaseCount = kbRows[0].count;

        // Get daily usage for the current month
        const [dailyUsage] = await pool.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM usage_tracking 
             WHERE user_id = ? AND usage_type = 'conversation'
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [userId]
        );

        return {
            subscription: subscription ? {
                plan: subscription.plan_id,
                planName: subscription.plan.name,
                price: subscription.plan.price,
                status: subscription.status
            } : {
                plan: 'free',
                planName: 'Starter',
                price: 0,
                status: 'active'
            },
            limits: {
                conversations: limits.conversationsPerMonth,
                knowledgeBase: limits.knowledgeBaseItems
            },
            usage: {
                conversations: conversationCount,
                knowledgeBase: knowledgeBaseCount
            },
            dailyUsage: dailyUsage,
            percentageUsed: limits.conversationsPerMonth > 0 
                ? Math.round((conversationCount / limits.conversationsPerMonth) * 100) 
                : 0
        };
    }

    /**
     * Check if user has exceeded their conversation limit
     */
    static async hasExceededLimit(userId) {
        const subscription = await Subscription.findByUserId(userId);
        const limits = subscription ? subscription.plan.limits : Subscription.PLANS.free.limits;
        
        // Unlimited plan
        if (limits.conversationsPerMonth === -1) {
            return false;
        }

        const currentUsage = await Usage.getCurrentConversationCount(userId);
        return currentUsage >= limits.conversationsPerMonth;
    }

    /**
     * Get usage by chatbot
     */
    static async getUsageByChatbot(userId) {
        const [rows] = await pool.execute(
            `SELECT c.id, c.business_name, COUNT(ut.id) as conversation_count
             FROM chatbots c
             LEFT JOIN usage_tracking ut ON c.id = ut.chatbot_id 
                 AND ut.usage_type = 'conversation'
                 AND ut.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
                 AND ut.created_at < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
             WHERE c.user_id = ?
             GROUP BY c.id, c.business_name`,
            [userId]
        );
        
        return rows;
    }

    /**
     * Reset usage for a new billing period (called automatically via subscription renewal)
     */
    static async resetForNewPeriod(userId) {
        // Usage is tracked by date, so no explicit reset needed
        // The queries automatically filter by current month
        return true;
    }

    /**
     * Clean up old usage records (older than 13 months)
     */
    static async cleanupOldRecords() {
        const [result] = await pool.execute(
            `DELETE FROM usage_tracking 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL 13 MONTH)`
        );
        return result.affectedRows;
    }
}

module.exports = Usage;