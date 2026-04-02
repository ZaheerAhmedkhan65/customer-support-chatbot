const pool  = require('../config/database');

class Chatbot {
    // Generate keywords from text using simple extraction
    static async generateKeywords(text) {
        // Remove common stop words and extract meaningful words
        const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for', 'of', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'been', 'being', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'will', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing'];
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
        
        // Get unique words and limit to 10
        const uniqueWords = [...new Set(words)].slice(0, 10);
        return uniqueWords.join(', ');
    }
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

    static async findByOrgId(orgId) {
        const [rows] = await pool.execute(
            `SELECT c.* FROM chatbots c 
             INNER JOIN users u ON c.user_id = u.id 
             WHERE u.org_id = ?`,
            [orgId]
        );
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

    static async updateKnowledge(knowledgeId, data) {
        const { content_type, question, answer, keywords } = data;
        const [result] = await pool.execute(
            'UPDATE knowledge_base SET content_type = ?, question = ?, answer = ?, keywords = ? WHERE id = ?',
            [content_type, question, answer, keywords, knowledgeId]
        );
        return result;
    }

    static async bulkAddKnowledge(chatbotId, entries) {
        // entries is an array of { content_type, question, answer, keywords }
        const values = entries.map(entry => [
            chatbotId,
            entry.content_type || 'general',
            entry.question || '',
            entry.answer || '',
            entry.keywords || ''
        ]);
        
        const [result] = await pool.execute(
            'INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) VALUES ?',
            [values]
        );
        return result.affectedRows;
    }

    static async getKnowledgeById(knowledgeId) {
        const [rows] = await pool.execute('SELECT * FROM knowledge_base WHERE id = ?', [knowledgeId]);
        return rows[0];
    }
}

module.exports = Chatbot;
