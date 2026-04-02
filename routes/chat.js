const express = require('express');
const pool = require('../config/database');
const Chatbot = require('../models/Chatbot');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const geminiService = require('../services/geminiService');
const router = express.Router();

router.post('/message', async (req, res) => {
    try {
        const { org_id, message, session_id } = req.body;

        // Get user by org_id
        const [users] = await pool.execute('SELECT id FROM users WHERE org_id = ?', [org_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Invalid organization' });
        }

        const userId = users[0].id;
        const chatbot = await Chatbot.findByUserId(userId);

        if (!chatbot || !chatbot.is_active) {
            return res.status(404).json({ error: 'Chatbot not active' });
        }

        // Check if user has exceeded their conversation limit
        const hasExceededLimit = await Usage.hasExceededLimit(userId);
        if (hasExceededLimit) {
            return res.status(429).json({ 
                error: 'Monthly conversation limit exceeded',
                message: 'You have reached your monthly conversation limit. Please upgrade your plan to continue using the chatbot.',
                upgradeUrl: '/dashboard?tab=billing'
            });
        }

        // Record the conversation usage (this will also check limits)
        const usageResult = await Usage.recordConversation(userId, chatbot.id, session_id);
        
        if (!usageResult.success) {
            return res.status(429).json({ 
                error: 'Monthly conversation limit exceeded',
                message: 'You have reached your monthly conversation limit. Please upgrade your plan to continue using the chatbot.',
                upgradeUrl: '/dashboard?tab=billing',
                usage: {
                    used: usageResult.used,
                    limit: usageResult.limit
                }
            });
        }

        // Get knowledge base
        const knowledge = await Chatbot.getKnowledge(chatbot.id);

        // Build context
        const context = geminiService.buildContext(knowledge);

        // Generate response
        const response = await geminiService.generateResponse(message, context);

        // Save conversation (already tracked in usage_tracking)
        await pool.execute(
            'INSERT INTO conversations (chatbot_id, session_id, user_message, bot_response) VALUES (?, ?, ?, ?)',
            [chatbot.id, session_id, message, response]
        );

        res.json({ 
            response, 
            business_name: chatbot.business_name,
            usage: {
                remaining: usageResult.remaining,
                limit: usageResult.limit,
                used: usageResult.used
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get conversation history (for admin panel)
router.get('/history', async (req, res) => {
    try {
        const { org_id, limit = 50 } = req.query;

        const [users] = await pool.execute('SELECT id FROM users WHERE org_id = ?', [org_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Invalid organization' });
        }

        const chatbot = await Chatbot.findByUserId(users[0].id);

        const [conversations] = await pool.execute(
            'SELECT * FROM conversations WHERE chatbot_id = ? ORDER BY created_at DESC LIMIT ?',
            [chatbot.id, parseInt(limit)]
        );

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get usage statistics
router.get('/usage', async (req, res) => {
    try {
        const { org_id } = req.query;

        if (!org_id) {
            return res.status(400).json({ error: 'org_id is required' });
        }

        const [users] = await pool.execute('SELECT id FROM users WHERE org_id = ?', [org_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Invalid organization' });
        }

        const usageStats = await Usage.getUsageStats(users[0].id);
        res.json({ success: true, usage: usageStats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;