const router = require('./base')();

// Static pages routes
router.get('/:page', (req, res) => {
    const page = req.params.page;
    const validPages = ['about', 'contact', 'blog', 'privacy', 'terms', 'security'];
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (validPages.includes(page)) {
        res.locals.title = page.charAt(0).toUpperCase() + page.slice(1);
        res.render(`pages/${page}`, { layout: isAjax ? false : 'layouts/application' });
    } else {
        res.status(404).render('index', { layout: false });
    }
});

module.exports = router;