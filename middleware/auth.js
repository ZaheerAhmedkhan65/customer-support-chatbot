const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (!token) {
        // Return JSON for API routes, redirect for web routes
        if (req.originalUrl.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
            return res.status(401).json({ error: 'Access token required' });
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

// Optional authentication - sets user if token is valid, but doesn't block if invalid/missing
const optionalAuthenticate = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

module.exports = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;
module.exports.authenticate = authenticate;
