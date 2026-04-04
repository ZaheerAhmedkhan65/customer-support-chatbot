const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const router = require('./base')();

/**
 * GET /chatbot.js
 * Serve chatbot.js with dynamic configuration based on pricing plan and usage
 * If org-id is provided (via query param, header, or data-org-id attribute), serve dynamic version
 * Otherwise, serve the static base version
 */
router.get('/chatbot.js', async (req, res) => {
    try {
        // Check for org-id from query parameter or header
        const orgId = req.query['org-id'] ||
            req.headers['x-org-id'] ||
            req.headers['data-org-id'];

        // Read the base chatbot.js file
        const chatbotJsPath = path.join(__dirname, '../public/chatbot.js');
        const chatbotScript = fs.readFileSync(chatbotJsPath, 'utf8');

        // If no org-id provided, serve the static version
        if (!orgId) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

            // Serve a version that fetches config dynamically
            const dynamicLoaderScript = `
// Chatbot Dynamic Loader
// This script will fetch configuration from the server based on data-org-id attribute
(function() {
    // Get org-id from the script tag's data attribute
    const scripts = document.getElementsByTagName('script');
    let orgId = null;
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('chatbot.js')) {
            orgId = scripts[i].getAttribute('data-org-id');
            break;
        }
    }
    
    if (!orgId) {
        console.warn('SupportBot: No data-org-id attribute found on script tag');
        return;
    }
    
    // Store orgId for later use
    window._chatbotOrgId = orgId;
    
    // Fetch configuration
    fetch('/chatbot/config?org-id=' + encodeURIComponent(orgId))
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window._chatbotConfig = data.config;
                console.log('SupportBot: Configuration loaded for', data.config.businessName);
            } else {
                console.error('SupportBot: Failed to load configuration:', data.error);
            }
        })
        .catch(err => {
            console.error('SupportBot: Error fetching configuration:', err);
        });
})();

`;
            res.send(dynamicLoaderScript + chatbotScript);
            return;
        }

        // Get user by org_id
        const [users] = await pool.execute('SELECT id FROM users WHERE org_id = ?', [orgId]);
        if (users.length === 0) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.send('/* Invalid org-id */ console.error("Chatbot: Invalid organization");');
            return;
        }

        const userId = users[0].id;

        // Get subscription and usage
        const subscription = await Subscription.findByUserId(userId);
        const usageStats = await Usage.getUsageStats(userId);
        const hasExceededLimit = await Usage.hasExceededLimit(userId);

        // Get chatbot configuration
        const Chatbot = require('../models/Chatbot');
        const chatbot = await Chatbot.findByUserId(userId);

        if (!chatbot || !chatbot.is_active) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.send('/* Chatbot not active */ console.error("Chatbot: Not active");');
            return;
        }

        // Build configuration object
        const config = {
            orgId: orgId,
            businessName: chatbot.business_name || 'Support Bot',
            businessEmail: chatbot.business_email || '',
            businessLogo: chatbot.business_logo || null,
            themeColor: chatbot.theme_color || '#3B82F6',
            buttonPosition: chatbot.button_position || 'right',
            welcomeMessage: chatbot.welcome_message || 'Hello! How can I help you today?',
            plan: subscription ? subscription.plan_id : 'free',
            planName: subscription ? subscription.plan.name : 'Starter',
            limits: subscription ? subscription.plan.limits : Subscription.PLANS.free.limits,
            usage: {
                conversations: usageStats.usage.conversations,
                limit: usageStats.limits.conversations,
                percentageUsed: usageStats.percentageUsed
            },
            hasExceededLimit: hasExceededLimit,
            features: {
                customBranding: subscription ? subscription.plan.limits.customBranding : false,
                apiAccess: subscription ? subscription.plan.limits.apiAccess : false,
                analytics: subscription ? subscription.plan.limits.analytics : 'basic'
            }
        };

        // Inject configuration into the script
        const configScript = `
// Chatbot Configuration
window._chatbotConfig = ${JSON.stringify(config, null, 2)};

// Usage limit warning
${hasExceededLimit ? `
console.warn('SupportBot: You have exceeded your monthly conversation limit. Upgrade your plan to continue.');
` : ''}
`;

        // Prepend configuration to the script
        const modifiedScript = configScript + '\n' + chatbotScript;

        // Set headers
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        res.send(modifiedScript);
    } catch (error) {
        console.error('Error serving chatbot.js:', error);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.status(500).send('/* Server error */ console.error("Chatbot: Server error");');
    }
});

/**
 * GET /chatbot.css
 * Serve chatbot.css
 */
router.get('/chatbot.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.join(__dirname, '../public/chatbot.css'));
});

/**
 * GET /chatbot/config
 * Get chatbot configuration as JSON (for dynamic loading)
 */
router.get('/chatbot/config', async (req, res) => {
    try {
        const orgId = req.query['org-id'] || req.headers['x-org-id'];

        if (!orgId) {
            return res.status(400).json({ error: 'org-id is required' });
        }

        const [users] = await pool.execute('SELECT id FROM users WHERE org_id = ?', [orgId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Invalid organization' });
        }

        const userId = users[0].id;

        // Get subscription and usage
        const subscription = await Subscription.findByUserId(userId);
        const usageStats = await Usage.getUsageStats(userId);
        const hasExceededLimit = await Usage.hasExceededLimit(userId);

        // Get chatbot configuration
        const Chatbot = require('../models/Chatbot');
        const chatbot = await Chatbot.findByUserId(userId);

        if (!chatbot || !chatbot.is_active) {
            return res.status(404).json({ error: 'Chatbot not active' });
        }

        const config = {
            success: true,
            config: {
                orgId: orgId,
                businessName: chatbot.business_name || 'Support Bot',
                businessEmail: chatbot.business_email || '',
                businessLogo: chatbot.business_logo || null,
                themeColor: chatbot.theme_color || '#3B82F6',
                buttonPosition: chatbot.button_position || 'right',
                welcomeMessage: chatbot.welcome_message || 'Hello! How can I help you today?',
                plan: subscription ? subscription.plan_id : 'free',
                planName: subscription ? subscription.plan.name : 'Starter',
                limits: subscription ? subscription.plan.limits : Subscription.PLANS.free.limits,
                usage: {
                    conversations: usageStats.usage.conversations,
                    limit: usageStats.limits.conversations,
                    percentageUsed: usageStats.percentageUsed
                },
                hasExceededLimit: hasExceededLimit,
                features: {
                    customBranding: subscription ? subscription.plan.limits.customBranding : false,
                    apiAccess: subscription ? subscription.plan.limits.apiAccess : false,
                    analytics: subscription ? subscription.plan.limits.analytics : 'basic'
                }
            }
        };

        res.json(config);
    } catch (error) {
        console.error('Error fetching chatbot config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

/**
 * GET /widget-test
 * Serve widget test page
 */
router.get('/widget-test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chatbot Widget Test</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                }
                .content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .instructions {
                    background: #e0f2fe;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                code {
                    background: #1e293b;
                    color: #e2e8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                pre {
                    background: #1e293b;
                    color: #e2e8f0;
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                .usage-info {
                    background: #fef3c7;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    border-left: 4px solid #f59e0b;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 Chatbot Widget Test Page</h1>
                <p>This page demonstrates your AI Customer Support Chatbot in action</p>
            </div>
            <div class="content">
                <h2>Welcome to Your Test Page</h2>
                <p>This is a sample page to test your chatbot widget. The chatbot should appear in the bottom corner of this page.</p>
                
                <h3>Sample Content</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                
                <div class="instructions">
                    <h3>📋 How to Add Chatbot to Your Website</h3>
                    <p>Copy and paste this script tag just before the closing <code></body></code> tag on your website:</p>
                    <pre><code id="embedCode">Loading embed code...</code></pre>
                    <button onclick="copyCode()" style="margin-top: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Copy Code</button>
                </div>

                <div class="usage-info" id="usageInfo" style="display: none;">
                    <h4>📊 Usage Information</h4>
                    <p id="usageDetails"></p>
                </div>
            </div>
            
            <script>
                // Get org_id from URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                const orgId = urlParams.get('org_id');
                
                if (orgId) {
                    const scriptUrl = window.location.origin + '/chatbot.js';
                    const embedCode = '<script src="' + scriptUrl + '" data-org-id="' + orgId + '"><\\/script>';
                    document.getElementById('embedCode').textContent = embedCode;
                    
                    // Fetch usage info
                    fetch(window.location.origin + '/chatbot/config?org-id=' + orgId)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                const usage = data.config.usage;
                                const usageInfo = document.getElementById('usageInfo');
                                const usageDetails = document.getElementById('usageDetails');
                                
                                const limitText = usage.limit === -1 ? 'Unlimited' : usage.limit.toLocaleString();
                                usageDetails.innerHTML = \`
                                    <strong>Plan:</strong> \${data.config.planName}<br>
                                    <strong>Conversations this month:</strong> \${usage.conversations.toLocaleString()} / \${limitText}<br>
                                    <strong>Usage:</strong> \${usage.percentageUsed}%\${usage.hasExceededLimit ? ' ⚠️ <strong>LIMIT EXCEEDED</strong>' : ''}
                                \`;
                                usageInfo.style.display = 'block';
                            }
                        })
                        .catch(err => console.error('Failed to fetch usage info:', err));
                } else {
                    document.getElementById('embedCode').textContent = 'No org_id provided. Please add ?org_id=your_org_id to the URL';
                }
                
                function copyCode() {
                    const code = document.getElementById('embedCode').textContent;
                    navigator.clipboard.writeText(code);
                    alert('Embed code copied to clipboard!');
                }
            </script>
            
            <!-- Chatbot will be injected here -->
        </body>
        </html>
    `);
});

module.exports = router;