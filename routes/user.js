const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/dashboard', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
    if (!token) {
        return res.redirect('/auth/signin');
    }
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.render('dashboard', { user, token });
    } catch (err) {
        return res.redirect('/auth/signin');
    }
});

module.exports = router;