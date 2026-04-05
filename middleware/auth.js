const jwt = require('jsonwebtoken');

/**
 * Authentication middleware that supports both JWT and Session (Google OAuth)
 * - Checks for JWT token in cookies, Authorization header, or query string
 * - Falls back to session authentication (for Google OAuth)
 * - Sets req.user from either method
 */
const authenticate = (req, res, next) => {
    // First, try to authenticate via JWT token
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
            return next();
        } catch (err) {
            // Token is invalid, but we might have a valid session
            console.log('JWT verification failed:', err.message);
        }
    }
    
    // If no valid JWT token, check for session authentication (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated()) {
        // User is authenticated via session (e.g., Google OAuth)
        return next();
    }
    
    // No valid authentication found
    if (req.originalUrl.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    return res.redirect('/auth/signin');
};

/**
 * Optional authentication - sets user if authenticated via JWT or session, 
 * but doesn't block if not authenticated
 */
const optionalAuthenticate = (req, res, next) => {
    // Try JWT token first
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
            return next();
        } catch (err) {
            // Token invalid, continue without error
        }
    }
    
    // Check session authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
        // User is authenticated via session
        return next();
    }
    
    // No authentication, but that's okay for optional auth
    next();
};

/**
 * Ensure user is authenticated via session (for Google OAuth flows)
 */
const ensureSessionAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    if (req.originalUrl.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
        return res.status(401).json({ error: 'Session authentication required' });
    }
    
    return res.redirect('/auth/signin');
};

/**
 * Ensure user is authenticated via JWT token
 */
const ensureJWTAuth = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (!token) {
        if (req.originalUrl.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
            return res.status(401).json({ error: 'JWT token required' });
        }
        return res.redirect('/auth/signin');
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (req.originalUrl.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            return res.redirect('/auth/signin');
        }
        req.user = user;
        next();
    });
};

module.exports = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;
module.exports.authenticate = authenticate;
module.exports.ensureSessionAuth = ensureSessionAuth;
module.exports.ensureJWTAuth = ensureJWTAuth;