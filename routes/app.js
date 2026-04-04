const express = require('express');
const authenticate = require('../middleware/auth');

// Route configuration with their mount paths and protection status
const routeConfig = [
    {
        name: 'auth',
        path: '/auth',
        protected: false,
        description: 'Authentication routes (signin, signup)'
    },
    {
        name: 'embed',
        path: '/',
        protected: false,
        description: 'Embed widget routes'
    },
    {
        name: 'chatbot',
        path: '/api/chatbot',
        protected: false,
        description: 'Chatbot management API'
    },
    {
        name: 'chat',
        path: '/api/chat',
        protected: false,
        description: 'Chat API'
    },
    {
        name: 'subscription',
        path: '/subscription',
        protected: false,
        description: 'Subscription management'
    },
    {
        name: 'user',
        path: '/api/user',
        protected: false,
        description: 'User profile and settings'
    }
];

/**
 * Initialize all routes with their respective protection settings
 * @param {express.Express} app - The Express application instance
 */
const initializeRoutes = (app) => {
    routeConfig.forEach(config => {
        const route = require(`./${config.name}`);
        const middleware = config.protected ? [authenticate] : [];
        
        app.use(config.path, ...middleware, route);
        
        const protectionStatus = config.protected ? '🔒 Protected' : '🌐 Public';
        console.log(`✔ Mounted ${config.name}.js → ${config.path} [${protectionStatus}]`);
    });
};

/**
 * Check if a route is protected
 * @param {string} routeName - The name of the route
 * @returns {boolean} - Whether the route is protected
 */
const isRouteProtected = (routeName) => {
    const config = routeConfig.find(c => c.name === routeName);
    return config ? config.protected : false;
};

/**
 * Get all protected route paths
 * @returns {string[]} - Array of protected route paths
 */
const getProtectedRoutes = () => {
    return routeConfig
        .filter(config => config.protected)
        .map(config => config.path);
};

/**
 * Get all public route paths
 * @returns {string[]} - Array of public route paths
 */
const getPublicRoutes = () => {
    return routeConfig
        .filter(config => !config.protected)
        .map(config => config.path);
};

module.exports = initializeRoutes;
module.exports.routeConfig = routeConfig;
module.exports.isRouteProtected = isRouteProtected;
module.exports.getProtectedRoutes = getProtectedRoutes;
module.exports.getPublicRoutes = getPublicRoutes;