const pool  = require('../config/database');

class Chatbot {
    static async create(userId, businessName, businessEmail) {
        const [result] = await pool.execute(
            'INSERT INTO chatbots (user_id, business_name, business_email) VALUES (?, ?, ?)',
            [userId, businessName, businessEmail]
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await pool.execute('SELECT * FROM chatbots WHERE user_id = ?', [userId]);
        return rows[0];
    }

    static async update(chatbotId, data) {
        // Get existing chatbot data first
        const existing = await Chatbot.findByUserId(chatbotId);
        
        const business_name = data.business_name || (existing ? existing.business_name : '');
        const business_email = data.business_email || (existing ? existing.business_email : '');
        const business_logo = data.business_logo || (existing ? existing.business_logo : '');
        const theme_color = data.theme_color || (existing ? existing.theme_color : '#3B82F6');
        const button_position = data.button_position || (existing ? existing.button_position : 'right');
        const welcome_message = data.welcome_message || (existing ? existing.welcome_message : 'Hello! How can I help you today?');
        const is_active = data.is_active !== undefined ? data.is_active : (existing ? existing.is_active : 1);
        
        const [result] = await pool.execute(
            'UPDATE chatbots SET business_name = ?, business_email = ?, business_logo = ?, theme_color = ?, button_position = ?, welcome_message = ?, is_active = ? WHERE id = ?',
            [business_name, business_email, business_logo, theme_color, button_position, welcome_message, is_active, chatbotId]
        );
        return result;
    }

    static async addKnowledge(chatbotId, contentType, question, answer, keywords) {
        const [result] = await pool.execute(
            'INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) VALUES (?, ?, ?, ?, ?)',
            [chatbotId, contentType, question, answer, keywords]
        );
        return result.insertId;
    }

    static async getKnowledge(chatbotId) {
        const [rows] = await pool.execute('SELECT * FROM knowledge_base WHERE chatbot_id = ?', [chatbotId]);
        return rows;
    }

    static async deleteKnowledge(knowledgeId) {
        const [result] = await pool.execute('DELETE FROM knowledge_base WHERE id = ?', [knowledgeId]);
        return result;
    }
}

module.exports = Chatbot;