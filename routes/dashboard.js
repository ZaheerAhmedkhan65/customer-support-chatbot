const router = require('./base')();

router.get('/', async (req, res) => {
    try {
        const user = req.user;

        const success = req.cookies.success || null;
        const error = req.cookies.error || null;
        res.clearCookie('success');
        res.clearCookie('error');

        const tab = req.query.tab || 'settings';

        const Chatbot = require('../models/Chatbot');
        const Conversation = require('../models/Conversation');

        const chatbot = await Chatbot.findByUserId(user.id);
        let knowledge = [];
        let embedCode = '';
        let conversations = [];

        if (chatbot) {
            knowledge = await Chatbot.getKnowledge(chatbot.id);
            const scriptUrl = `${req.protocol}://${req.get('host')}/chatbot.js`;
            embedCode = `
<script
    src="${scriptUrl}"
    data-org-id="${user.org_id}">
</script>`;
        }

        try {
            conversations = await Conversation.getByOrgId(user.org_id, 50);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }

        const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
        res.render('dashboard', {
            user,
            token: req.cookies.token,
            success,
            error,
            tab,
            chatbot,
            knowledge,
            embedCode,
            conversations,
            layout: isAjax ? false : 'layouts/application'
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        return res.redirect('/auth/signin');
    }
});

module.exports = router;
