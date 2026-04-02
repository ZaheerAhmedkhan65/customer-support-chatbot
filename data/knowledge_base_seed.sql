-- Knowledge Base Seed Data for Customer Support Chatbot Platform
-- This file contains sample knowledge base content for the platform's own chatbot
-- Run this after creating a chatbot to populate it with helpful responses

-- IMPORTANT: Replace 1 with the actual chatbot ID from your database
-- You can find this by running: SELECT id FROM chatbots WHERE user_id = YOUR_USER_ID;

-- ============================================
-- GENERAL QUESTIONS
-- ============================================

-- What is this platform?
INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'What is Customer Support Chatbot?', 
'Customer Support Chatbot is an AI-powered chatbot platform that helps businesses provide 24/7 customer support on their websites. Our chatbot uses Google Gemini API to understand and respond to customer queries intelligently, reducing the need for a large support team while maintaining high-quality customer service.', 
'what, is, platform, about, description, chatbot, ai, support');

-- How does the chatbot work?
INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'How does the AI chatbot work?', 
'Our chatbot works by combining AI-powered natural language understanding with your custom knowledge base. When a visitor asks a question, the chatbot analyzes the query, searches your knowledge base for relevant information, and uses Google Gemini AI to generate accurate, context-aware responses. You can train the chatbot by adding FAQs, policies, and product information to your knowledge base.', 
'how, does, work, ai, gemini, respond, answer');

-- ============================================
-- GETTING STARTED
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'How do I get started?', 
'Getting started is easy! 1) Sign up for a free account, 2) Configure your chatbot appearance in the dashboard (theme color, welcome message, etc.), 3) Add your knowledge base content (FAQs, policies, product info), 4) Copy the embed script and paste it into your website HTML before the closing </body> tag. Your chatbot will be live immediately!', 
'get, started, begin, setup, install, first, steps');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'How do I embed the chatbot on my website?', 
'To embed the chatbot, go to your dashboard and click on the "Embed Script" tab. Copy the provided JavaScript code and paste it into your website HTML, just before the closing </body> tag. The script works on any website platform including WordPress, Shopify, Wix, and custom HTML sites. The chatbot will appear as a floating button in the bottom corner of your page.', 
'embed, install, add, website, script, html, integrate, integration');

-- ============================================
-- PRICING
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'Is there a free trial?', 
'Yes! We offer a free trial so you can test all features of the platform before committing. During the trial, you have full access to the chatbot dashboard, knowledge base management, and analytics. No credit card required to start.', 
'free, trial, test, demo, try, pricing');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'What are the pricing plans?', 
'We offer flexible pricing plans to suit businesses of all sizes. Our plans are based on the number of conversations per month. Visit our pricing page for detailed information, or contact our sales team for enterprise solutions. All plans include unlimited knowledge base entries and basic analytics.', 
'pricing, plans, cost, price, subscription, payment');

-- ============================================
-- FEATURES
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'What features are available?', 
'Our platform includes: AI-powered responses using Google Gemini, customizable chatbot appearance (colors, position, welcome message), knowledge base management for FAQs and policies, conversation analytics and history, easy embed script for any website, secure user authentication, and multi-language support through AI.', 
'features, capabilities, what, can, do, options');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'Can I customize the chatbot appearance?', 
'Yes! You can fully customize your chatbot appearance through the dashboard. Options include: theme color, button position (left or right), welcome message, business name, and business logo. The chatbot is designed to blend seamlessly with your brand identity.', 
'customize, appearance, design, theme, color, logo, branding, style');

-- ============================================
-- KNOWLEDGE BASE
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'How do I add content to the knowledge base?', 
'To add knowledge base content: 1) Go to your dashboard and click "Knowledge Base", 2) Fill in the form with content type (FAQ, Policy, etc.), question/topic, answer, and relevant keywords, 3) Click "Add to Knowledge Base". The AI will use this content to answer customer questions. You can add unlimited entries and edit or delete them anytime.', 
'add, knowledge, base, content, faq, entries, create, manage');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'What types of content can I add?', 
'You can add various types of content including: FAQs (frequently asked questions), Policies (refund, privacy, terms), Product details, Delivery information, General information, and any other content your customers might need. Each entry can include keywords to help the AI match questions accurately.', 
'types, content, faq, policy, product, delivery, information');

-- ============================================
-- ANALYTICS
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'Can I see conversation history?', 
'Yes! The Analytics tab in your dashboard shows all conversations between your chatbot and visitors. You can view the full conversation history, including user messages and bot responses, timestamps, and session IDs. This helps you understand customer needs and improve your knowledge base.', 
'analytics, history, conversations, view, see, logs, track');

-- ============================================
-- SECURITY & PRIVACY
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'policy', 'Is my data secure?', 
'Yes, we take security seriously. All data is encrypted in transit using HTTPS. User passwords are hashed using bcrypt. We use JWT tokens for secure authentication. Your knowledge base content and conversation data are stored securely and are only accessible to your account. We do not share your data with third parties.', 
'secure, security, data, encryption, safe, protect, privacy');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'policy', 'What is your privacy policy?', 
'We respect your privacy. We collect only essential data needed to provide the service. Conversation data is stored to provide analytics and improve service quality. We use cookies for authentication. We do not sell your data to third parties. For full details, please review our complete privacy policy page.', 
'privacy, policy, data, cookies, collection, gdpr');

-- ============================================
-- SUPPORT
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'How can I get help?', 
'If you need assistance, you can: 1) Check our documentation and FAQ section, 2) Contact our support team via email, 3) Use the contact form on our website. Our support team typically responds within 24 hours on business days.', 
'help, support, contact, assistance, email, team');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'faq', 'Do you offer technical support?', 
'Yes, we provide technical support for all users. Our team can help with integration issues, API questions, and general troubleshooting. Premium plan users get priority support with faster response times.', 
'technical, support, help, troubleshooting, api, integration');

-- ============================================
-- API & INTEGRATION
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'product', 'What platforms does the chatbot work with?', 
'Our chatbot works with any website platform! The embed script is pure JavaScript and works on: WordPress, Shopify, Wix, Squarespace, Webflow, custom HTML sites, React, Angular, Vue.js applications, and more. As long as you can add a script tag to your HTML, you can use our chatbot.', 
'platforms, wordpress, shopify, wix, integration, compatible, works');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'product', 'Does the chatbot work on mobile devices?', 
'Yes! The chatbot is fully responsive and works perfectly on all devices including smartphones, tablets, and desktop computers. The chat window automatically adjusts to fit smaller screens, and the floating button is touch-friendly.', 
'mobile, responsive, phone, tablet, device, screen');

-- ============================================
-- TROUBLESHOOTING
-- ============================================

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'general', 'The chatbot is not appearing on my website', 
'If the chatbot is not appearing: 1) Make sure you copied the entire embed script, 2) Verify the script is placed before the closing </body> tag, 3) Check that your website uses HTTPS (or HTTP for localhost), 4) Clear your browser cache and refresh, 5) Check browser console for any error messages. If issues persist, contact our support team.', 
'not, appearing, showing, visible, problem, issue, troubleshoot');

INSERT INTO knowledge_base (chatbot_id, content_type, question, answer, keywords) 
VALUES (1, 'general', 'The chatbot is not responding correctly', 
'If the chatbot is not responding correctly: 1) Add more specific content to your knowledge base, 2) Include relevant keywords for each entry, 3) Make sure your questions and answers are clear and detailed, 4) The AI may need more context - try adding more knowledge base entries. You can also review conversation analytics to see what questions are being asked.', 
'not, responding, wrong, incorrect, answer, problem, issue');