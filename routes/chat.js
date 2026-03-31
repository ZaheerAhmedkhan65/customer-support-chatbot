const express = require('express');
const pool = require('../config/database');
const Chatbot = require('../models/Chatbot');
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

        // Get knowledge base
        const knowledge = await Chatbot.getKnowledge(chatbot.id);

        // Build context
        const context = geminiService.buildContext(knowledge);

        // Generate response
        const response = await geminiService.generateResponse(message, context);

        // Save conversation
        await pool.execute(
            'INSERT INTO conversations (chatbot_id, session_id, user_message, bot_response) VALUES (?, ?, ?, ?)',
            [chatbot.id, session_id, message, response]
        );

        res.json({ response, business_name: chatbot.business_name });
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

module.exports = router;