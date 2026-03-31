const express = require('express');
const path = require('path');
const router = express.Router();

// Serve chatbot.js file
router.get('/chatbot.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    console.log(path.join(__dirname, '../public/chatbot.js'));
    res.sendFile(path.join(__dirname, '../public/chatbot.js'));
});

// Serve chatbot.css file
router.get('/chatbot.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(__dirname, 'public/chatbot.css'));
});

// Serve widget test page
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
                    <p>Copy and paste this script tag just before the closing <code>&lt;/body&gt;</code> tag on your website:</p>
                    <pre><code id="embedCode">Loading embed code...</code></pre>
                    <button onclick="copyCode()" style="margin-top: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Copy Code</button>
                </div>
            </div>
            
            <script>
                // Get org_id from URL parameter or use default
                const urlParams = new URLSearchParams(window.location.search);
                const orgId = urlParams.get('org_id');
                
                if (orgId) {
                    const embedCode = '<script src="' + window.location.origin + '/chatbot.js" data-org-id="' + orgId + '"><\/script>';
                    document.getElementById('embedCode').textContent = embedCode;
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