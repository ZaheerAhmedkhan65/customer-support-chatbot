const router = require('./base')();
const ContactMessage = require('../models/ContactMessage');

router.get('/contact', (req, res) => {
    const success = req.cookies.contactSuccess || null;
    if (success) res.clearCookie('contactSuccess');

    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
    res.render('pages/contact', {
        layout: isAjax ? false : 'layouts/application',
        success,
        error: null,
        formData: {}
    });
});

router.post('/contact', async (req, res) => {
    const body = req.body || {};
    const formData = {
        name: typeof body.name === 'string' ? body.name.trim() : '',
        email: typeof body.email === 'string' ? body.email.trim() : '',
        subject: typeof body.subject === 'string' ? body.subject.trim() : '',
        message: typeof body.message === 'string' ? body.message.trim() : ''
    };
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
    const renderFormError = (status, error) => {
        res.status(status).render('pages/contact', {
            layout: isAjax ? false : 'layouts/application',
            success: null,
            error,
            formData
        });
    };

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        return renderFormError(400, 'Please complete all fields before submitting.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return renderFormError(400, 'Please enter a valid email address.');
    }
    if (formData.name.length > 100 || formData.email.length > 254
        || formData.subject.length > 200 || formData.message.length > 5000) {
        return renderFormError(400, 'Please shorten the submitted fields and try again.');
    }

    try {
        await ContactMessage.create(formData);
        res.cookie('contactSuccess', 'Thanks for contacting us. Your message has been received.', {
            httpOnly: true,
            maxAge: 10000,
            sameSite: 'lax'
        });
        return res.redirect('/pages/contact');
    } catch (error) {
        console.error('Contact form submission error:', error);
        return renderFormError(500, 'We could not send your message. Please try again later.');
    }
});

// Static pages routes
router.get('/:page', (req, res) => {
    const page = req.params.page;
    const validPages = ['about', 'blog', 'privacy', 'terms', 'security'];
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (validPages.includes(page)) {
        res.locals.title = page.charAt(0).toUpperCase() + page.slice(1);
        res.render(`pages/${page}`, { layout: isAjax ? false : 'layouts/application' });
    } else {
        res.status(404).render('index', { layout: false });
    }
});

module.exports = router;