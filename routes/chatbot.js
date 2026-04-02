// routes/chatbot.js
const express = require('express');
const authenticate = require('../middleware/auth');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
const router = express.Router();

// Middleware to authenticate from cookie
const authenticateFromCookie = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.redirect('/auth/signin');
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.redirect('/auth/signin');
    }
};

// Get chatbot settings (API endpoint for backward compatibility - requires auth)
router.get('/settings', authenticateFromCookie, async (req, res) => {
    try {
        let chatbot = await Chatbot.findByUserId(req.user.id);

        if (!chatbot) {
            // Create default chatbot
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        const knowledge = await Chatbot.getKnowledge(chatbot.id);

        res.json({ chatbot, knowledge });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get chatbot settings for embedded widget (public endpoint - no auth required)
router.get('/public-settings', async (req, res) => {
    try {
        const orgId = req.query.org_id;
        
        if (!orgId) {
            return res.status(400).json({ 
                chatbot: {
                    business_name: 'Customer Support',
                    theme_color: '#3B82F6',
                    button_position: 'right',
                    welcome_message: 'Hello! How can I help you today?'
                }
            });
        }

        let chatbot = await Chatbot.findByOrgId(orgId);

        if (!chatbot) {
            // Return default settings if no chatbot found
            return res.json({
                chatbot: {
                    business_name: 'Customer Support',
                    theme_color: '#3B82F6',
                    button_position: 'right',
                    welcome_message: 'Hello! How can I help you today?'
                }
            });
        }

        // Return only the public-facing settings
        res.json({
            chatbot: {
                business_name: chatbot.business_name || 'Customer Support',
                theme_color: chatbot.theme_color || '#3B82F6',
                button_position: chatbot.button_position || 'right',
                welcome_message: chatbot.welcome_message || 'Hello! How can I help you today?'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            chatbot: {
                business_name: 'Customer Support',
                theme_color: '#3B82F6',
                button_position: 'right',
                welcome_message: 'Hello! How can I help you today?'
            }
        });
    }
});

// Update chatbot settings via POST (for form submission)
router.post('/settings', authenticateFromCookie, async (req, res) => {
    try {
        let chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            // Create default chatbot first
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        await Chatbot.update(chatbot.id, req.body);
        
        // Redirect back to dashboard with success message
        res.cookie('success', 'Settings saved successfully!', { maxAge: 5000 });
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Failed to save settings', { maxAge: 5000 });
        res.redirect('/dashboard');
    }
});

// Add knowledge via POST (for form submission)
router.post('/knowledge', authenticateFromCookie, async (req, res) => {
    try {
        let chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            // Create default chatbot first
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        const { content_type, question, answer, keywords } = req.body;
        await Chatbot.addKnowledge(chatbot.id, content_type, question, answer, keywords);

        // Redirect back to knowledge tab with success message
        res.cookie('success', 'Knowledge added successfully!', { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Failed to add knowledge', { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    }
});

// Update knowledge via POST with _method=PUT
router.post('/knowledge/:id', authenticateFromCookie, async (req, res) => {
    try {
        if (req.query._method === 'PUT' || (req.body && req.body._method === 'PUT')) {
            const { content_type, question, answer, keywords } = req.body;
            await Chatbot.updateKnowledge(req.params.id, { content_type, question, answer, keywords });
            res.cookie('success', 'Knowledge updated successfully!', { maxAge: 5000 });
            res.redirect('/dashboard?tab=knowledge');
        } else if (req.query._method === 'DELETE' || (req.body && req.body._method === 'DELETE')) {
            await Chatbot.deleteKnowledge(req.params.id);
            res.cookie('success', 'Knowledge deleted successfully!', { maxAge: 5000 });
            res.redirect('/dashboard?tab=knowledge');
        } else {
            res.redirect('/dashboard?tab=knowledge');
        }
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Failed to update knowledge', { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    }
});

// Bulk import knowledge from JSON
router.post('/knowledge/bulk-import', authenticateFromCookie, async (req, res) => {
    try {
        let chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        const { entries } = req.body;
        
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            res.cookie('error', 'No entries provided for bulk import', { maxAge: 5000 });
            return res.redirect('/dashboard?tab=knowledge');
        }

        // Limit to 50 entries at a time
        const limitedEntries = entries.slice(0, 50);
        const addedCount = await Chatbot.bulkAddKnowledge(chatbot.id, limitedEntries);

        res.cookie('success', `Successfully imported ${addedCount} knowledge base entries!`, { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Failed to import knowledge base entries', { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    }
});

// AI-powered content generation
router.post('/knowledge/generate', authenticateFromCookie, async (req, res) => {
    try {
        const { prompt, type } = req.body;
            console.log('Received AI generation request with prompt:', prompt, 'and type:', type);
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const geminiService = require('../services/geminiService');
        let aiPrompt = '';

        if (type === 'faq') {
            aiPrompt = `Generate 5 FAQ entries for a business with the following description: "${prompt}". 
            Return the response as a JSON array with objects containing: question, answer, and keywords (comma-separated).
            Example format: [{"question": "What are your business hours?", "answer": "We are open...", "keywords": "hours, open, schedule"}]`;
        } else if (type === 'keywords') {
            aiPrompt = `Extract 10 relevant keywords from the following text: "${prompt}". 
            Return only a comma-separated list of keywords.`;
        } else if (type === 'answer') {
            aiPrompt = `Write a detailed, professional answer for the following question: "${prompt}". 
            The answer should be helpful for customer support. Return only the answer text.`;
        } else {
            aiPrompt = `Generate helpful customer support content based on: "${prompt}". 
            Return the response as a JSON array with objects containing: content_type, question, answer, and keywords.
            Example format: [{"content_type": "faq", "question": "...", "answer": "...", "keywords": "..."}]`;
        }

        const result = await geminiService.generateContent(aiPrompt);
        res.json({ result: result.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

// Get knowledge templates
router.get('/knowledge/templates', authenticateFromCookie, async (req, res) => {
    try {
        const templates = getKnowledgeTemplates();
        res.json({ templates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Apply knowledge template
router.post('/knowledge/apply-template', authenticateFromCookie, async (req, res) => {
    try {
        console.log('Applying knowledge template with data:', req.body);
        let chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        const { templateId } = req.body;
        console.log('Applying template with ID:', templateId);
        const templates = getKnowledgeTemplates();
        const template = templates.find(t => t.id === templateId);
        console.log('Selected template:', template);
        if (!template) {
            return res.status(400).json({ success: false, error: 'Invalid template selected' });
        }

        const addedCount = await Chatbot.bulkAddKnowledge(chatbot.id, template.entries);

        // Return JSON response instead of redirect to avoid SSL protocol errors
        // when browser follows redirect as a resource load
        res.json({ success: true, message: `Successfully added ${addedCount} entries from "${template.name}" template!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to apply template' });
    }
});

// Knowledge templates data
function getKnowledgeTemplates() {
    return [
        {
            id: 'ecommerce-basic',
            name: 'E-commerce Basics',
            description: 'Essential FAQs for online stores',
            category: 'E-commerce',
            entries: [
                { content_type: 'faq', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secured with SSL encryption.', keywords: 'payment, credit card, paypal, apple pay, google pay, secure' },
                { content_type: 'faq', question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping (2-3 business days) and overnight shipping are available at checkout. International shipping times vary by location.', keywords: 'shipping, delivery, time, express, overnight, international' },
                { content_type: 'policy', question: 'What is your return policy?', answer: 'We offer a 30-day return policy for unused items in original packaging. To initiate a return, contact our support team with your order number. Refunds are processed within 5-7 business days of receiving the returned item.', keywords: 'return, refund, policy, 30 days, unused, packaging' },
                { content_type: 'faq', question: 'Do you offer free shipping?', answer: 'Yes! We offer free standard shipping on orders over $50. Free shipping applies to domestic orders only.', keywords: 'free shipping, minimum order, domestic' },
                { content_type: 'faq', question: 'How can I track my order?', answer: 'Once your order ships, you will receive an email with tracking information. You can also track your order by logging into your account and viewing your order history.', keywords: 'track, tracking, order, email, account' }
            ]
        },
        {
            id: 'saas-basic',
            name: 'SaaS Product Basics',
            description: 'Common FAQs for software services',
            category: 'SaaS',
            entries: [
                { content_type: 'faq', question: 'Is there a free trial?', answer: 'Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. You can upgrade to a paid plan anytime during or after your trial.', keywords: 'free trial, 14 days, features, credit card, upgrade' },
                { content_type: 'faq', question: 'What happens to my data if I cancel?', answer: 'You can export all your data at any time. After cancellation, your data remains accessible for 30 days, after which it is permanently deleted from our servers.', keywords: 'cancel, data, export, delete, accessible' },
                { content_type: 'faq', question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate your billing accordingly.', keywords: 'plan, upgrade, downgrade, change, prorate, billing' },
                { content_type: 'policy', question: 'What is your refund policy?', answer: 'We offer a 30-day money-back guarantee for annual subscriptions. Monthly subscriptions can be cancelled anytime but are not eligible for refunds.', keywords: 'refund, money-back, guarantee, annual, monthly, cancel' },
                { content_type: 'faq', question: 'Do you offer customer support?', answer: 'Yes, we provide 24/7 email support for all plans. Phone support is available for Professional and Enterprise plans. We also have extensive documentation and video tutorials.', keywords: 'support, 24/7, email, phone, documentation, tutorials' }
            ]
        },
        {
            id: 'restaurant-basic',
            name: 'Restaurant Basics',
            description: 'Common questions for restaurants',
            category: 'Restaurant',
            entries: [
                { content_type: 'faq', question: 'What are your opening hours?', answer: 'We are open Monday-Thursday 11am-10pm, Friday-Saturday 11am-11pm, and Sunday 12pm-9pm. Holiday hours may vary.', keywords: 'hours, open, schedule, monday, tuesday, weekend' },
                { content_type: 'faq', question: 'Do you take reservations?', answer: 'Yes, we accept reservations for parties of 4 or more. You can make a reservation online through our website or by calling us directly.', keywords: 'reservation, book, party, online, call' },
                { content_type: 'faq', question: 'Do you offer vegetarian or vegan options?', answer: 'Yes, we have a variety of vegetarian and vegan options clearly marked on our menu. We can also modify most dishes to accommodate dietary restrictions.', keywords: 'vegetarian, vegan, dietary, menu, options, restrictions' },
                { content_type: 'faq', question: 'Do you offer delivery or takeout?', answer: 'Yes, we offer both delivery and takeout services. Order through our website, or find us on popular delivery apps like Uber Eats, DoorDash, and Grubhub.', keywords: 'delivery, takeout, ubereats, doordash, grubhub, order' },
                { content_type: 'policy', question: 'What is your cancellation policy for large groups?', answer: 'For parties of 8 or more, we require at least 24 hours notice for cancellations. A cancellation fee may apply for last-minute cancellations.', keywords: 'cancellation, large group, 24 hours, fee, policy' }
            ]
        },
        {
            id: 'general-business',
            name: 'General Business',
            description: 'Universal business FAQs',
            category: 'General',
            entries: [
                { content_type: 'faq', question: 'How can I contact customer support?', answer: 'You can reach our support team via email at support@company.com, by phone at 1-800-XXX-XXXX, or through the live chat on our website. Our team is available Monday-Friday, 9am-6pm EST.', keywords: 'contact, support, email, phone, live chat, hours' },
                { content_type: 'faq', question: 'Where are you located?', answer: 'Our main office is located at [Your Address]. We also serve customers nationwide/worldwide through our online platform.', keywords: 'location, address, office, serve, nationwide' },
                { content_type: 'faq', question: 'What are your business hours?', answer: 'Our business hours are Monday through Friday, 9:00 AM to 6:00 PM EST. We are closed on major holidays. For urgent matters outside business hours, you can email us and we will respond the next business day.', keywords: 'hours, business hours, monday, friday, holidays, urgent' },
                { content_type: 'policy', question: 'How do you protect my privacy?', answer: 'We take privacy seriously. Your personal information is encrypted and stored securely. We never sell your data to third parties. For full details, please review our Privacy Policy.', keywords: 'privacy, secure, encrypt, data, third party, policy' },
                { content_type: 'faq', question: 'Do you offer refunds?', answer: 'Refund eligibility depends on the product or service purchased. Please refer to our specific refund policy or contact customer support for details about your situation.', keywords: 'refund, eligible, policy, contact, support' }
            ]
        }
    ];
}

// Get embed script
router.get('/embed-script', authenticateFromCookie, async (req, res) => {
    try {
        const chatbot = await Chatbot.findByUserId(req.user.id);
        const user = { org_id: req.user.org_id };
        const host = req.get('host');
        
        // Use http for localhost, https for production
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        const scriptUrl = `${protocol}://${host}/chatbot.js`;
        const embedCode = `<script src="${scriptUrl}" data-org-id="${user.org_id}"></script>`;

        res.json({ embedCode, scriptUrl, orgId: user.org_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// Analytics API Endpoints
// ============================================

// Get analytics summary
router.get('/analytics/summary', authenticateFromCookie, async (req, res) => {
    try {
        const pool = require('../config/database');
        const chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            return res.json({
                success: true,
                summary: {
                    totalConversations: 0,
                    totalSessions: 0,
                    todayConversations: 0,
                    avgMessagesPerSession: 0
                }
            });
        }

        // Get total conversations
        const [totalConv] = await pool.execute(
            'SELECT COUNT(*) as count FROM conversations WHERE chatbot_id = ?',
            [chatbot.id]
        );

        // Get unique sessions
        const [sessions] = await pool.execute(
            'SELECT COUNT(DISTINCT session_id) as count FROM conversations WHERE chatbot_id = ?',
            [chatbot.id]
        );

        // Get today's conversations
        const [todayConv] = await pool.execute(
            `SELECT COUNT(*) as count FROM conversations 
             WHERE chatbot_id = ? AND DATE(created_at) = CURDATE()`,
            [chatbot.id]
        );

        // Get average messages per session
        const [avgMsgs] = await pool.execute(
            `SELECT COUNT(*) / COUNT(DISTINCT session_id) as avg FROM conversations WHERE chatbot_id = ?`,
            [chatbot.id]
        );

        res.json({
            success: true,
            summary: {
                totalConversations: totalConv[0].count || 0,
                totalSessions: sessions[0].count || 0,
                todayConversations: todayConv[0].count || 0,
                avgMessagesPerSession: avgMsgs[0].avg ? Math.round(avgMsgs[0].avg) : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
});

// Get chart data (last 7 days)
router.get('/analytics/chart-data', authenticateFromCookie, async (req, res) => {
    try {
        const pool = require('../config/database');
        const chatbot = await Chatbot.findByUserId(req.user.id);
        
        if (!chatbot) {
            return res.json({
                success: true,
                labels: [],
                data: []
            });
        }

        // Get conversations per day for last 7 days
        const [rows] = await pool.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM conversations 
             WHERE chatbot_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [chatbot.id]
        );

        // Format labels and data
        const labels = [];
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            
            const found = rows.find(r => r.date === dateStr);
            data.push(found ? found.count : 0);
        }
        console.log('Chart data labels:', labels);
        console.log('Chart data values:', data);
        res.json({ success: true, labels, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Get conversations with pagination
router.get('/analytics/conversations', authenticateFromCookie, async (req, res) => {
    try {
        const pool = require('../config/database');
        const chatbot = await Chatbot.findByUserId(req.user.id);
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        
        // Validate and set defaults
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 50;
        if (limit > 100) limit = 100; // Cap at 100
        
        const offset = (page - 1) * limit;

        if (!chatbot) {
            return res.json({
                success: true,
                conversations: []
            });
        }

        // Use query() instead of execute() for better parameter handling
        const [conversations] = await pool.query(
            `SELECT * FROM conversations 
             WHERE chatbot_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [chatbot.id, limit, offset]
        );

        res.json({ success: true, conversations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

module.exports = router;
