const router = require('./base')();

// User profile route
router.get('/profile', async (req, res) => {
    try {
        const user = req.user;
        res.json({
            id: user.id,
            email: user.email,
            org_id: user.org_id
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Update user settings
router.put('/settings', async (req, res) => {
    try {
        const user = req.user;
        const { email, preferences } = req.body;
        
        // TODO: Implement user settings update
        res.json({
            message: 'Settings updated successfully',
            user: {
                id: user.id,
                email: email || user.email,
                org_id: user.org_id
            }
        });
    } catch (err) {
        console.error('Error updating user settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;