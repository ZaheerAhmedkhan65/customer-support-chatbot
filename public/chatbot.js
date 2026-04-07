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
        themeColor: '#212529',
        businessName: 'Customer Support',
        subtitle: 'Customer Support',
        displaySubtitle: false,
        welcomeMessage: 'Hello! How can I help you today?',
        quickReplies: ['Help', 'Pricing', 'Contact', 'FAQ', 'Talk to agent', 'Other', 'None of these']
    };


    // Load chatbot configuration from server (public endpoint for embedded widgets)
    async function loadConfig() {
        try {
            const response = await fetch(`${config.apiUrl}/api/chatbot/public-settings?org_id=${config.orgId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.chatbot) {
                    config.position = data.chatbot.button_position || 'right';
                    config.themeColor = data.chatbot.theme_color || '#212529';
                    config.businessName = data.chatbot.business_name || 'Customer Support';
                    config.subtitle = data.chatbot.subtitle || 'Customer Support';
                    config.displaySubtitle = data.chatbot.display_subtitle || false;
                    config.welcomeMessage = data.chatbot.welcome_message || 'Hello! How can I help you today?';
                }
            }
            console.log('Chatbot config loaded:', config);
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

                #close-btn {
                    background: none;
                    border: none;
                    color: white;
                    padding: 2px 8px;
                    font-size: 18px;
                    cursor: pointer;
                    border-radius: 50%;
                    transition: background 0.2s, color 0.2s;
                }

                #close-btn:hover {
                    color: ${config.themeColor};
                    background: white;                    
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
                    text-align: start;
                }
                
                .chatbot-header h3 {
                    margin: 0;
                    font-size: 25px;
                }
                
                .chatbot-header p {
                    margin: 4px 0 0;
                    font-size: 12px;
                    opacity: 0.6;
                }
                
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f9fafb;
                }

                /* Scrollbar */
                .chatbot-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .chatbot-messages::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }

                .chatbot-messages::-webkit-scrollbar-thumb {
                    background: ${config.themeColor};
                    border-radius: 3px;
                }

                .chatbot-messages::-webkit-scrollbar-thumb:hover {
                    background: ${config.themeColor};
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
                    max-width: 80%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    word-wrap: break-word;
                }
                
                .message.user .message-content {
                    background: ${config.themeColor};
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                
                .message.bot .message-content {
                    background: white;
                    color: #1f2937;
                    border: 1px solid #e5e7eb;
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }

                .quick-replies {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    padding: 10px;
                    background: #fff;
                    border-top: 1px solid #eee;
                }

                .quick-reply {
                    background: #f1f5f9;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 16px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .quick-reply:hover {
                    background: #e2e8f0;
                }
                
                .chatbot-input-container {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 8px;
                }

                #emoji-btn {
                    border: none;
                    background: none;
                    font-size: 20px;
                    cursor: pointer;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                #emoji-btn:hover {
                    background: #f1f5f9;
                }
                
                .chatbot-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 25px;
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
                    border-radius: 25px;
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
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3>${config.businessName}</h3>
                            ${config.displaySubtitle ? `<p>${config.subtitle}</p>` : ''}
                        </div>
                        <button id="close-btn">✕</button>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">
                        <div class="message-content">${config.welcomeMessage}</div>
                    </div>
                </div>
                <div class="quick-replies" id="quick-replies">
                    ${config.quickReplies.map(reply =>
        `<button class="quick-reply">${reply}</button>`
    ).join('')}
                </div>
                <div class="chatbot-input-container">
                    <button id="emoji-btn">😊</button>
                    <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type your message...">
                    <button class="chatbot-send" disabled id="chatbot-send">Send</button>
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

    input.addEventListener('input', () => {
        sendBtn.disabled = input.value.trim() === '' || isProcessing;
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

    const quickReplyBtns = document.querySelectorAll('.quick-reply');

    quickReplyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.textContent;
            sendMessage();
        });
    });

    const emojiBtn = document.getElementById('emoji-btn');
    let emojiPicker = null;

    const emojis = ['😊', '👍', '❤️', '😂', '🎉', '🤔', '👋', '🙏'];

    emojiBtn.addEventListener('click', (e) => {
        if (emojiPicker) {
            emojiPicker.remove();
            emojiPicker = null;
            return;
        }

        emojiPicker = document.createElement('div');
        emojiPicker.className = 'emoji-picker';

        emojiPicker.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        z-index: 999999;
    `;

        // ✅ Get button position
        const rect = emojiBtn.getBoundingClientRect();

        const pickerWidth = 200;
        const pickerHeight = 150 * 0.6;

        let left = rect.left;
        let top = rect.top - pickerHeight - 10;

        // ✅ Prevent overflow RIGHT
        if (left + pickerWidth > window.innerWidth) {
            left = window.innerWidth - pickerWidth - 10;
        }

        // ✅ Prevent overflow LEFT
        if (left < 10) {
            left = 10;
        }

        // ✅ Prevent overflow TOP
        if (top < 10) {
            top = rect.bottom + 10;
        }

        emojiPicker.style.left = left + 'px';
        emojiPicker.style.top = top + 'px';

        // Add emojis
        emojis.forEach(e => {
            const btn = document.createElement('button');
            btn.textContent = e;
            btn.style.cssText = `
            font-size: 20px;
            padding: 6px;
            border: none;
            background: none;
            cursor: pointer;
            border-radius: 6px;
        `;

            btn.onmouseenter = () => btn.style.background = '#f1f5f9';
            btn.onmouseleave = () => btn.style.background = 'none';

            btn.onclick = () => {
                input.value += e;
                emojiPicker.remove();
                emojiPicker = null;
                input.focus();
                sendBtn.disabled = input.value.trim() === '' || isProcessing; // Update send button state
            };

            emojiPicker.appendChild(btn);
        });

        document.body.appendChild(emojiPicker);
    });

    const closeBtn = document.getElementById('close-btn');

    closeBtn.addEventListener('click', () => {
        dialog.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.remove();
            emojiPicker = null;
        }
    });
}


    // Initialize chatbot when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbot);
    } else {
        createChatbot();
    }
})();