const pool = require('../config/database');

class Conversation {
    // Create a new conversation entry
    static async create(chatbotId, sessionId, userMessage, botResponse) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO conversations (chatbot_id, session_id, user_message, bot_response, created_at) VALUES (?, ?, ?, ?, NOW())',
                [chatbotId, sessionId, userMessage, botResponse]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    // Get conversations by chatbot ID with pagination
    static async getByChatbotId(chatbotId, limit = 50, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, session_id, user_message, bot_response, created_at 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [chatbotId, parseInt(limit), parseInt(offset)]
            );
            return rows;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    // Get conversations by session ID
    static async getBySessionId(sessionId, limit = 50) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, user_message, bot_response, created_at 
                 FROM conversations 
                 WHERE session_id = ? 
                 ORDER BY created_at ASC 
                 LIMIT ?`,
                [sessionId, parseInt(limit)]
            );
            return rows;
        } catch (error) {
            console.error('Error getting conversations by session:', error);
            throw error;
        }
    }

    // Get conversation statistics
    static async getStats(chatbotId, days = 7) {
        try {
            // Total conversations count
            const [totalResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM conversations WHERE chatbot_id = ?',
                [chatbotId]
            );

            // Conversations in last N days
            const [recentResult] = await pool.execute(
                `SELECT COUNT(*) as recent 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
                [chatbotId, days]
            );

            // Daily breakdown
            const [dailyResult] = await pool.execute(
                `SELECT DATE(created_at) as date, COUNT(*) as count 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY DATE(created_at)
                 ORDER BY date DESC`,
                [chatbotId, days]
            );

            // Most common questions
            const [commonQuestions] = await pool.execute(
                `SELECT user_message, COUNT(*) as count 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 GROUP BY user_message 
                 ORDER BY count DESC 
                 LIMIT 10`,
                [chatbotId]
            );

            // Average response length
            const [avgLength] = await pool.execute(
                `SELECT AVG(LENGTH(bot_response)) as avg_length 
                 FROM conversations 
                 WHERE chatbot_id = ?`,
                [chatbotId]
            );

            return {
                total_conversations: totalResult[0]?.total || 0,
                recent_conversations: recentResult[0]?.recent || 0,
                daily_breakdown: dailyResult,
                common_questions: commonQuestions,
                avg_response_length: Math.round(avgLength[0]?.avg_length || 0)
            };
        } catch (error) {
            console.error('Error getting conversation stats:', error);
            throw error;
        }
    }

    // Search conversations by keyword
    static async search(chatbotId, keyword, limit = 50) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, session_id, user_message, bot_response, created_at 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 AND (user_message LIKE ? OR bot_response LIKE ?)
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [chatbotId, `%${keyword}%`, `%${keyword}%`, parseInt(limit)]
            );
            return rows;
        } catch (error) {
            console.error('Error searching conversations:', error);
            throw error;
        }
    }

    // Delete old conversations (for data retention)
    static async deleteOldConversations(chatbotId, daysToKeep = 30) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM conversations WHERE chatbot_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [chatbotId, daysToKeep]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error deleting old conversations:', error);
            throw error;
        }
    }

    // Get conversations by org ID
    static async getByOrgId(orgId, limit = 50) {
        try {
            // Validate parameters
            if (!orgId) {
                return [];
            }
            
            const safeLimit = limit ? parseInt(limit) : 50;
            
            // Use pool.query instead of pool.execute for better parameter handling
            const [rows] = await pool.query(
                `SELECT id, session_id, user_message, bot_response, created_at 
                 FROM conversations 
                 WHERE chatbot_id IN (
                     SELECT id FROM chatbots WHERE user_id IN (
                         SELECT id FROM users WHERE org_id = ?
                     )
                 )
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [orgId, safeLimit]
            );
            return rows;
        } catch (error) {
            console.error('Error getting conversations by org ID:', error);
            return [];
        }
    }

    // Get unique session count
    static async getUniqueSessions(chatbotId, days = 30) {
        try {
            const [result] = await pool.execute(
                `SELECT COUNT(DISTINCT session_id) as unique_sessions 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
                [chatbotId, days]
            );
            return result[0]?.unique_sessions || 0;
        } catch (error) {
            console.error('Error getting unique sessions:', error);
            throw error;
        }
    }

    // Export all conversations for a chatbot
    static async exportAll(chatbotId) {
        try {
            const [rows] = await pool.execute(
                `SELECT session_id, user_message, bot_response, created_at 
                 FROM conversations 
                 WHERE chatbot_id = ? 
                 ORDER BY created_at ASC`,
                [chatbotId]
            );
            return rows;
        } catch (error) {
            console.error('Error exporting conversations:', error);
            throw error;
        }
    }

    // Get conversation by ID
    static async getById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM conversations WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting conversation by ID:', error);
            throw error;
        }
    }

    // Update conversation (e.g., for feedback)
    static async updateFeedback(id, feedback) {
        try {
            const [result] = await pool.execute(
                'UPDATE conversations SET feedback = ? WHERE id = ?',
                [feedback, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating conversation feedback:', error);
            throw error;
        }
    }
}

module.exports = Conversation;