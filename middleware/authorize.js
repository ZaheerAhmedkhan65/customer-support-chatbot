// middlewares/authorize.js
const isJsonRequest = (req) => {
    return req.xhr
        || req.originalUrl?.startsWith('/api')
        || req.headers.accept?.includes('application/json')
        || req.get('content-type')?.includes('application/json');
};

const getrequestedUserId = (req) => {
    return req.params.user_id
        || req.body?.user_id
        || req.query?.user_id
        || req.user?.id
        || null;
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        const wantsJson = isJsonRequest(req);

        if (!req.user) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. User not authenticated.'
                });
            }
            return res.redirect('/auth/signin');
        }

        const userRole = String(req.user.role || 'user').toLowerCase();
        if (!allowedRoles.includes(userRole)) {
            if (wantsJson) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }
            return res.status(403).send('Access denied. Insufficient permissions.');
        }

        if (userRole === 'user') {
            const requestedUserId = getrequestedUserId(req);
            console.log('Requested resource ID:', requestedUserId);
            // If no specific resource is being requested, allow it
            if (requestedUserId === null) return next();

            const currentUserId = String(req.user.id || '');

            if (String(requestedUserId).toLowerCase() !== currentUserId.toLowerCase()) {
                if (wantsJson) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only access your own data.'
                    });
                }
                return res.status(403).render('error', {
                    message: 'You do not have permission to access this page.',
                    title: 'Access Denied',
                    redirect_url: req.get('Referer') || '/'
                });
            }
        }

        next();
    };
};

const canAccessUser = (req, res, next) => {
    const requestedUserId = req.params.user_id || req.body.user_id;
    const user = req.user;

    if (!requestedUserId) {
        return next();
    }

    if (user.role === 'admin') return next();
    if ((user.role === 'user') && String(user.id) === String(requestedUserId)) return next();

    return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot access this resource.'
    });
};

module.exports = {
    authorize,
    canAccessUser
};