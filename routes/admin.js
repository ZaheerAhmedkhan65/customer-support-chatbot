const express = require('express');
const authenticate = require('../middleware/auth');
const ApiKey = require('../models/ApiKey');
const pool = require('../config/database');
const router = express.Router();

const requireAdmin = async (req, res, next) => {
    try {
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(403).json({ error: 'Access denied' });
    }
};

router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const [apiKeys] = await pool.execute('SELECT * FROM api_keys ORDER BY service, id ASC');
        const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [chatbotsCount] = await pool.execute('SELECT COUNT(*) as count FROM chatbots');
        const [conversationsCount] = await pool.execute('SELECT COUNT(*) as count FROM conversations');
        const [knowledgeEntriesCount] = await pool.execute('SELECT COUNT(*) as count FROM knowledge_base');

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            apiKeys,
            stats: {
                users: usersCount[0].count,
                chatbots: chatbotsCount[0].count,
                conversations: conversationsCount[0].count,
                knowledgeEntries: knowledgeEntriesCount[0].count
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Error loading admin dashboard');
    }
});

router.get('/pages/users', authenticate, requireAdmin, async (req, res) => {
    res.render('admin/users', { title: 'User Management' });
});

router.get('/pages/subscriptions', authenticate, requireAdmin, async (req, res) => {
    res.render('admin/subscriptions', { title: 'Subscription Management' });
});

router.get('/pages/health', authenticate, requireAdmin, async (req, res) => {
    res.render('admin/health', { title: 'System Health' });
});

router.get('/api-keys', authenticate, requireAdmin, async (req, res) => {
    try {
        const apiKeys = await ApiKey.getAll();
        res.json({ apiKeys });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

router.post('/api-keys', authenticate, requireAdmin, async (req, res) => {
    try {
        const { service, key_value, name } = req.body;
        if (!service || !key_value) {
            return res.status(400).json({ error: 'Service and key_value are required' });
        }
        const id = await ApiKey.create({ service, key_value, name });
        res.json({ success: true, id, message: 'API key created successfully' });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

router.put('/api-keys/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { key_value, name, is_active } = req.body;
        await ApiKey.update(id, { key_value, name, is_active });
        res.json({ success: true, message: 'API key updated successfully' });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ error: 'Failed to update API key' });
    }
});

router.delete('/api-keys/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await ApiKey.delete(id);
        res.json({ success: true, message: 'API key deleted successfully' });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

router.get('/api/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.id, u.email, u.name, u.org_id, u.created_at,
                    COUNT(DISTINCT c.id) as chatbot_count,
                    COUNT(DISTINCT conv.id) as conversation_count
             FROM users u
             LEFT JOIN chatbots c ON u.id = c.user_id
             LEFT JOIN conversations conv ON c.id = conv.chatbot_id
             GROUP BY u.id
             ORDER BY u.created_at DESC`
        );
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/api/subscriptions', authenticate, requireAdmin, async (req, res) => {
    try {
        const [subscriptions] = await pool.execute(
            `SELECT s.*, u.email, u.name, u.org_id 
             FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             ORDER BY s.created_at DESC`
        );
        res.json({ subscriptions });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

router.get('/api/health', authenticate, requireAdmin, async (req, res) => {
    try {
        const [dbStatus] = await pool.execute('SELECT 1 AS ok');
        const dbHealthy = dbStatus && dbStatus.length > 0;

        let geminiStatus = 'unknown';
        try {
            const keys = await ApiKey.findActiveByService('gemini');
            geminiStatus = keys.length > 0 ? 'configured' : 'not_configured';
        } catch (e) {
            geminiStatus = 'error';
        }

        res.json({
            status: dbHealthy ? 'healthy' : 'degraded',
            database: dbHealthy ? 'connected' : 'disconnected',
            gemini: geminiStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.json({
            status: 'degraded',
            database: 'error',
            gemini: 'error',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;