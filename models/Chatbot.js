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
    static async create(
        userId,
        businessName = '',
        subtitle = '',
        displaySubtitle = false,
        businessEmail = null
    ) {
        const [result] = await pool.execute(
            `INSERT INTO chatbots
        (user_id, business_name, subtitle, display_subtitle, business_email)
        VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                businessName,
                subtitle,
                displaySubtitle,
                businessEmail
            ]
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
        const subtitle = data.subtitle || (existing ? existing.subtitle : '');
        const display_subtitle = data.display_subtitle || (existing ? existing.display_subtitle : false);
        const business_logo = data.business_logo || (existing ? existing.business_logo : '');
        const theme_color = data.theme_color || (existing ? existing.theme_color : '#3B82F6');
        const button_position = data.button_position || (existing ? existing.button_position : 'right');
        const welcome_message = data.welcome_message || (existing ? existing.welcome_message : 'Hello! How can I help you today?');
        const is_active = data.is_active !== undefined ? data.is_active : (existing ? existing.is_active : 1);
        
        // Handle custom_emojis and custom_quick_replies as JSON
        const custom_emojis = data.custom_emojis !== undefined ? data.custom_emojis : (existing ? existing.custom_emojis : null);
        const show_emoji_toggle = data.show_emoji_toggle !== undefined ? data.show_emoji_toggle : (existing ? existing.show_emoji_toggle : true);
        const custom_quick_replies = data.custom_quick_replies !== undefined ? data.custom_quick_replies : (existing ? existing.custom_quick_replies : null);
        const show_quick_replies = data.show_quick_replies !== undefined ? data.show_quick_replies : (existing ? existing.show_quick_replies : true);
        const default_chatbot_open = data.default_chatbot_open !== undefined ? data.default_chatbot_open : (existing ? existing.default_chatbot_open : false);
        
        const [result] = await pool.execute(
            'UPDATE chatbots SET business_name = ?, subtitle = ?, display_subtitle = ?, business_email = ?, business_logo = ?, theme_color = ?, button_position = ?, welcome_message = ?, is_active = ?, custom_emojis = ?, show_emoji_toggle = ?, custom_quick_replies = ?, show_quick_replies = ?, default_chatbot_open = ? WHERE id = ?',
            [business_name, subtitle, display_subtitle, business_email, business_logo, theme_color, button_position, welcome_message, is_active, custom_emojis, show_emoji_toggle, custom_quick_replies, show_quick_replies, default_chatbot_open, chatbotId]
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
        // Normalize crawler/varied content types to the exact values the DB accepts.
        // These match the options used by the manual knowledge-base form.
        function normalizeType(raw) {
            const v = (raw || 'general').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
            if (['faq','frequently asked questions','f-a-q'].includes(v)) return 'faq';
            if (['policy','policies'].includes(v)) return 'policy';
            if (['delivery','deliveryinfo','deliveryinfo','deliveryinformation'].includes(v) || v === 'delivery') return 'delivery';
            if (['refund','refundpolicy','refundpolicies'].includes(v)) return 'refund';
            if (['product','productdetails','productdetail'].includes(v)) return 'product';
            if (['shipping','shippinginformation','shippinginfo'].includes(v)) return 'shipping';
            if (['pricing','pricingplans','plan','plans','subscription'].includes(v)) return 'pricing';
            if (['account','accountmanagement'].includes(v)) return 'account';
            if (['technical','technicalsupport','troubleshooting'].includes(v)) return 'technical';
            if (['billing','billinginvoicing','invoice','invoices','payment'].includes(v)) return 'billing';
            if (['security','securityprivacy'].includes(v)) return 'security';
            if (['returns','returnsexchanges','exchange','exchanges','refund'].includes(v)) return 'returns';
            if (['warranty','warrantyinformation','guarantee','guarantees'].includes(v)) return 'warranty';
            if (['installation','installationsetup','setup','gettingstarted','guide','tutorial'].includes(v)) return 'installation';
            if (['integration','integrationsapi','api','developer','developers','integrations'].includes(v)) return 'integration';
            if (['compliance','compliancelegal','terms','termsofservice'].includes(v)) return 'compliance';
            if (['training','trainings'].includes(v)) return 'training';
            if (['maintenance','maintenanceupkeep','upkeep','care'].includes(v)) return 'maintenance';
            return 'general';
        }

        const values = entries.map(entry => {
            return [
                chatbotId,
                normalizeType(entry.content_type),
                (entry.question || '').replace(/\s+/g, ' ').trim().substring(0, 500),
                (entry.answer || '').substring(0, 5000),
                (entry.keywords || '').substring(0, 200)
            ];
        });

        if (values.length === 0) return 0;

        // Build placeholders for each row: (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), ...
        const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const flatValues = values.flat();

        // Log for debugging
        console.log('INSERT placeholders:', placeholders);
        console.log('INSERT flatValues:', JSON.stringify(flatValues).substring(0, 500));
        const [result] = await pool.execute(
            `INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) VALUES ${placeholders}`,
            flatValues
        );
        return result.affectedRows;
    }

    static async getKnowledgeById(knowledgeId) {
        const [rows] = await pool.execute('SELECT * FROM knowledge_base WHERE id = ?', [knowledgeId]);
        return rows[0];
    }
}

module.exports = Chatbot;
