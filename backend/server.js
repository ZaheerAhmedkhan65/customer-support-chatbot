const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const { initDatabase } = require('./config/database');

dotenv.config();

const app = express();

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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Helper to check if user is authenticated from token
const isAuthenticated = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return false;

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        return user;
    } catch (err) {
        return false;
    }
};

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from backend/public
app.use(express.static(path.join(__dirname, 'public')));

// Serve chatbot.js specifically from root public directory
app.get('/chatbot.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.join(__dirname, '..', 'public', 'chatbot.js'));
});

// Serve chatbot.css specifically from root public directory
app.get('/chatbot.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.join(__dirname, '..', 'public', 'chatbot.css'));
});

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
        } catch (err) {
            res.locals.user = null;
            res.locals.isAuthenticated = false;
            res.locals.token = '';
        }
    } else {
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        res.locals.token = '';
    }

    next();
});

// Routes
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const chatRoutes = require('./routes/chat');
const embedRoutes = require('./routes/embed');

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});