const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();;
const path = require('path');
const jwt = require('jsonwebtoken');
const expressLayouts = require("express-ejs-layouts");

const app = express();

// Trust proxy for correct protocol detection behind Vercel's load balancer
// Using 'loopback' in development and specific trust for production
if (process.env.NODE_ENV === 'production') {
    // Trust the first proxy only (Vercel's load balancer)
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', 'loopback');
}

// Security middleware with CSP configuration for cross-origin script loading
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "*"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
            styleSrc: ["'self'", "'unsafe-inline'", "*"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
            connectSrc: ["'self'", "*", "ws:", "wss:"],
            fontSrc: ["'self'", "data:", "*"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "*"],
            frameSrc: ["'self'", "*"]
        }
    }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressLayouts);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    validate: {
        // Disable trust proxy validation since we need it for Vercel deployment
        trustProxy: false
    }
});
app.use('/api/', limiter);

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set("layout", "layouts/application");

// Serve static files from assets directory
app.use(express.static(path.join(__dirname, 'assets')));

// Note: chatbot.js and chatbot.css are now served by embed routes
// with dynamic configuration based on pricing plan and usage

// Middleware to make user available to all views
app.use((req, res, next) => {
    // Check for token in cookie, Authorization header, or query string
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
            res.locals.user = user;
            res.locals.isAuthenticated = true;
            res.locals.token = token;
            res.locals.title = req.query.title || '';
            res.locals.page = req.path === '/' ? 'index' : '';
        } catch (err) {
            res.locals.user = null;
            res.locals.isAuthenticated = false;
            res.locals.token = '';
            res.locals.title = '';
            res.locals.page = req.path === '/' ? 'index' : '';
        }
    } else {
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        res.locals.token = '';
        res.locals.title = '';
        res.locals.page = req.path === '/' ? 'index' : '';
    }
    res.locals.path = req.path;
    res.locals.queryTabParams = req.query.tab || '';
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const chatRoutes = require('./routes/chat');
const embedRoutes = require('./routes/embed');
const subscriptionRoutes = require('./routes/subscription');

// Index route
app.get('/', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
    res.render('index', {
        user: res.locals.user,
        token: token || ''
    });
});

app.use('/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/', embedRoutes);

// Dashboard route (protected)
app.get('/dashboard', async (req, res) => {
    // Check for token in cookie, Authorization header, or query string
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (!token) {
        return res.redirect('/auth/signin');
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // Get success/error messages from cookies
        const success = req.cookies.success || null;
        const error = req.cookies.error || null;
        res.clearCookie('success');
        res.clearCookie('error');

        // Get tab from query param
        const tab = req.query.tab || 'settings';

        // Fetch chatbot data
        const Chatbot = require('./models/Chatbot');
        const Conversation = require('./models/Conversation');

        let chatbot = await Chatbot.findByUserId(user.id);
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

        // Fetch conversations for analytics
        try {
            conversations = await Conversation.getByOrgId(user.org_id, 50);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }

        res.render('dashboard', {
            user,
            token,
            success,
            error,
            tab,
            chatbot,
            knowledge,
            embedCode,
            conversations
        });
    } catch (err) {
        return res.redirect('/auth/signin');
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/signin');
});

// Static pages routes
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const validPages = ['about', 'contact', 'blog', 'privacy', 'terms', 'security'];
    
    if (validPages.includes(page)) {
        res.locals.title = page.charAt(0).toUpperCase() + page.slice(1);
        res.render(`pages/${page}`);
    } else {
        res.status(404).render('index');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});