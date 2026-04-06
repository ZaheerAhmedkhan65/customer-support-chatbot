//server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const expressLayouts = require("express-ejs-layouts");
const pool = require('./config/database'); // MySQL connection pool
const { authenticate, optionalAuthenticate } = require('./middleware/auth');

const app = express();

// Trust proxy for correct protocol detection behind Vercel's load balancer
// Using 'loopback' in development and specific trust for production
if (process.env.NODE_ENV === 'production') {
    // Trust the first proxy only (Vercel's load balancer)
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', 'loopback');
}

require('./config/passport');

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

// Configure dynamic layout support after express-ejs-layouts
// This middleware runs for every request and sets the layout based on AJAX
app.use((req, res, next) => {
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    // For SPA navigation, we don't want the layout for AJAX requests
    // Setting this after expressLayouts ensures it takes effect
    if (isAjax) {
        res.locals.layout = false;
    }
    
    next();
});

const sessionStore = new MySQLStore({
    expiration: 86400000, // 1 day in milliseconds
    createDatabaseTable: true, // Will create sessions table if it doesn't exist
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, pool);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production' ? true : false,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));


app.use(passport.initialize());
app.use(passport.session());

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

// Middleware to make user available to all views (supports both JWT and Session)
app.use((req, res, next) => {
    let user = null;
    let token = null;
    let isAuthenticated = false;

    // First, try to authenticate via JWT token
    const jwtToken = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (jwtToken) {
        try {
            user = jwt.verify(jwtToken, process.env.JWT_SECRET);
            token = jwtToken;
            isAuthenticated = true;
            req.user = user;
        } catch (err) {
            // JWT token invalid, continue to check session
            console.log('JWT verification failed in view middleware:', err.message);
        }
    }

    // If no valid JWT, check for session authentication (Google OAuth)
    if (!isAuthenticated && req.isAuthenticated && req.isAuthenticated()) {
        user = req.user;
        isAuthenticated = true;
        // For session auth, we might also want to set a JWT token for API calls
        // This helps with AJAX requests that need authentication
        if (!token && user) {
            try {
                token = jwt.sign(
                    { id: user.id, org_id: user.org_id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
            } catch (signErr) {
                console.log('Failed to create JWT from session:', signErr.message);
            }
        }
    }

    // Set view locals
    res.locals.user = user;
    res.locals.isAuthenticated = isAuthenticated;
    res.locals.token = token || '';
    res.locals.title = req.query.title || '';
    res.locals.page = req.path === '/' ? 'index' : '';
    res.locals.path = req.path;
    res.locals.queryTabParams = req.query.tab || '';

    next();
});

// Routes
const initializeRoutes = require('./routes/app');
initializeRoutes(app);

// Index route
app.get('/', (req, res) => {
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
    res.render('index', { layout: isAjax ? false : 'layouts/application' });
});

// Dashboard route (protected)
app.get('/dashboard', authenticate, async (req, res) => {
    try {
        const user = req.user;

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

// Logout route (handles both JWT and Session logout)
app.get('/logout', (req, res) => {
    // Clear JWT cookie
    res.clearCookie('token');
    
    // Destroy session if exists (for Google OAuth users)
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });
    }
    
    // Logout from passport if logged in
    if (req.logout) {
        req.logout((err) => {
            if (err) {
                console.error('Passport logout error:', err);
            }
        });
    }
    
    res.redirect('/auth/signin');
});

// Static pages routes
app.get('/pages/:page', (req, res) => {
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