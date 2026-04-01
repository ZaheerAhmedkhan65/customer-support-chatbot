const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.get('/signup', (req, res) => {
    const error = req.cookies.error || null;
    res.clearCookie('error');
    res.render('auth/signup', { error });
});

router.get('/signin', (req, res) => {
    const error = req.cookies.error || null;
    res.clearCookie('error');
    res.render('auth/signin', { error });
});

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Signup request:', { email, password: password ? '***' : null });
        // Validation
        if (!email || !password) {
            res.cookie('error', 'Email and password required', { maxAge: 5000 });
            return res.redirect('/auth/signup');
        }

        if (password.length < 6) {
            res.cookie('error', 'Password must be at least 6 characters', { maxAge: 5000 });
            return res.redirect('/auth/signup');
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            res.cookie('error', 'Email already registered', { maxAge: 5000 });
            return res.redirect('/auth/signup');
        }

        // Create user
        const user = await User.create(email, password);
        console.log('User created:', user);
        // Create token
        const token = jwt.sign(
            { id: user.id, org_id: user.org_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'strict'
        });

        // Redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Server error', { maxAge: 5000 });
        res.redirect('/auth/signup');
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            res.cookie('error', 'Invalid credentials', { maxAge: 5000 });
            return res.redirect('/auth/signin');
        }

        const isValid = await User.verifyPassword(password, user.password);
        if (!isValid) {
            res.cookie('error', 'Invalid credentials', { maxAge: 5000 });
            return res.redirect('/auth/signin');
        }

        const token = jwt.sign(
            { id: user.id, org_id: user.org_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'strict'
        });

        // Redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.cookie('error', 'Server error', { maxAge: 5000 });
        res.redirect('/auth/signin');
    }
});

module.exports = router;