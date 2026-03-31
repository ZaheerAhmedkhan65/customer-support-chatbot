(function () {
    // Get organization ID and API URL from script tag
    const scripts = document.getElementsByTagName('script');
    let orgId = null;
    let scriptSrc = null;

    for (let script of scripts) {
        if (script.src && script.src.includes('chatbot.js')) {
            orgId = script.getAttribute('data-org-id');
            scriptSrc = script.src;
            break;
        }
    }

    if (!orgId) {
        console.error('Chatbot: Missing data-org-id attribute');
        return;
    }

    // Extract base URL from script src
    let apiUrl = '';
    if (scriptSrc) {
        try {
            const url = new URL(scriptSrc);
            apiUrl = url.origin;
        } catch (e) {
            apiUrl = window.location.origin;
        }
    } else {
        apiUrl = window.location.origin;
    }

    // Configuration
    const config = {
        apiUrl: apiUrl,
        orgId: orgId,
        position: 'right', // Will be updated from server
        themeColor: '#3B82F6',
        businessName: 'Customer Support',
        welcomeMessage: 'Hello! How can I help you today?'
    };

    // Load chatbot configuration from server
    async function loadConfig() {
        try {
            const response = await fetch(`${config.apiUrl}/api/chatbot/settings?org_id=${config.orgId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.chatbot) {
                    config.position = data.chatbot.button_position || 'right';
                    config.themeColor = data.chatbot.theme_color || '#3B82F6';
                    config.businessName = data.chatbot.business_name || 'Customer Support';
                    config.welcomeMessage = data.chatbot.welcome_message || 'Hello! How can I help you today?';
                }
            }
        } catch (error) {
            console.error('Failed to load chatbot config:', error);
        }
    }

    // Create chatbot UI
    async function createChatbot() {
        await loadConfig();

        // Create container
        const container = document.createElement('div');
        container.id = 'ai-chatbot-container';
        container.innerHTML = `
            <style>
                #ai-chatbot-container {
                    position: fixed;
                    ${config.position}: 20px;
                    bottom: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                }
                
                .chatbot-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: ${config.themeColor};
                    color: white;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .chatbot-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                }
                
                .chatbot-dialog {
                    position: absolute;
                    bottom: 80px;
                    ${config.position === 'right' ? 'right: 0' : 'left: 0'};
                    width: 380px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .chatbot-header {
                    background: ${config.themeColor};
                    color: white;
                    padding: 16px;
                    text-align: center;
                }
                
                .chatbot-header h3 {
                    margin: 0;
                    font-size: 18px;
                }
                
                .chatbot-header p {
                    margin: 4px 0 0;
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f9fafb;
                }
                
                .message {
                    margin-bottom: 12px;
                    display: flex;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .message.user {
                    justify-content: flex-end;
                }
                
                .message-content {
                    max-width: 70%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    word-wrap: break-word;
                }
                
                .message.user .message-content {
                    background: ${config.themeColor};
                    color: white;
                }
                
                .message.bot .message-content {
                    background: white;
                    color: #1f2937;
                    border: 1px solid #e5e7eb;
                }
                
                .chatbot-input-container {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 8px;
                }
                
                .chatbot-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .chatbot-input:focus {
                    border-color: ${config.themeColor};
                }
                
                .chatbot-send {
                    padding: 8px 16px;
                    background: ${config.themeColor};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: opacity 0.2s;
                }
                
                .chatbot-send:hover:not(:disabled) {
                    opacity: 0.9;
                }
                
                .chatbot-send:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .typing-indicator {
                    display: inline-block;
                    padding: 10px 14px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                }
                
                .typing-dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #9ca3af;
                    margin: 0 2px;
                    animation: typing 1.4s infinite;
                }
                
                .typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-10px);
                    }
                }
                
                .chatbot-dialog.hidden {
                    display: none;
                }
            </style>
            <button class="chatbot-button" id="chatbot-toggle">
                💬
            </button>
            <div class="chatbot-dialog hidden" id="chatbot-dialog">
                <div class="chatbot-header">
                    <h3>${config.businessName}</h3>
                    <p>Customer Support</p>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">
                        <div class="message-content">${config.welcomeMessage}</div>
                    </div>
                </div>
                <div class="chatbot-input-container">
                    <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type your message...">
                    <button class="chatbot-send" id="chatbot-send">Send</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Set up event listeners
        const toggleBtn = document.getElementById('chatbot-toggle');
        const dialog = document.getElementById('chatbot-dialog');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        const messagesContainer = document.getElementById('chatbot-messages');

        let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        let isProcessing = false;

        toggleBtn.addEventListener('click', () => {
            dialog.classList.toggle('hidden');
        });

        async function sendMessage() {
            const message = input.value.trim();
            if (!message || isProcessing) return;

            // Add user message
            addMessage(message, 'user');
            input.value = '';
            isProcessing = true;
            sendBtn.disabled = true;

            // Show typing indicator
            const typingId = showTypingIndicator();

            try {
                const response = await fetch(`${config.apiUrl}/api/chat/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        org_id: config.orgId,
                        message: message,
                        session_id: sessionId
                    })
                });

                const data = await response.json();
                removeTypingIndicator(typingId);

                if (response.ok) {
                    addMessage(data.response, 'bot');
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
            } catch (error) {
                removeTypingIndicator(typingId);
                addMessage('Sorry, I\'m having trouble connecting. Please check your internet connection.', 'bot');
            } finally {
                isProcessing = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            messageDiv.innerHTML = `<div class="message-content">${escapeHtml(text)}</div>`;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot';
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            return 'typing-indicator';
        }

        function removeTypingIndicator(id) {
            const indicator = document.getElementById(id);
            if (indicator) indicator.remove();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Initialize chatbot when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbot);
    } else {
        createChatbot();
    }
})();