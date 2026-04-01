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

// Get chatbot settings (API endpoint for backward compatibility)
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

// Delete knowledge via POST with _method=DELETE
router.post('/knowledge/:id', authenticateFromCookie, async (req, res) => {
    try {
        if (req.query._method === 'DELETE' || (req.body && req.body._method === 'DELETE')) {
            await Chatbot.deleteKnowledge(req.params.id);
            res.cookie('success', 'Knowledge deleted successfully!', { maxAge: 5000 });
            res.redirect('/dashboard?tab=knowledge');
        } else {
            res.redirect('/dashboard?tab=knowledge');
        }
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Failed to delete knowledge', { maxAge: 5000 });
        res.redirect('/dashboard?tab=knowledge');
    }
});

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

module.exports = router;