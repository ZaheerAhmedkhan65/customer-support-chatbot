/**
 * Knowledge Base Seeder Script
 * 
 * This script populates a chatbot's knowledge base with pre-defined content
 * for the Customer Support Chatbot platform.
 * 
 * Usage:
 *   node scripts/seed-knowledge-base.js <user_id>
 * 
 * Example:
 *   node scripts/seed-knowledge-base.js 1
 */

const Chatbot = require('../models/Chatbot');
const pool = require('../config/database');

// Knowledge base content for the platform's chatbot
const knowledgeBaseContent = [
    // GENERAL QUESTIONS
    {
        content_type: 'faq',
        question: 'What is Customer Support Chatbot?',
        answer: 'Customer Support Chatbot is an AI-powered chatbot platform that helps businesses provide 24/7 customer support on their websites. Our chatbot uses Google Gemini API to understand and respond to customer queries intelligently, reducing the need for a large support team while maintaining high-quality customer service.',
        keywords: 'what, is, platform, about, description, chatbot, ai, support'
    },
    {
        content_type: 'faq',
        question: 'How does the AI chatbot work?',
        answer: 'Our chatbot works by combining AI-powered natural language understanding with your custom knowledge base. When a visitor asks a question, the chatbot analyzes the query, searches your knowledge base for relevant information, and uses Google Gemini AI to generate accurate, context-aware responses. You can train the chatbot by adding FAQs, policies, and product information to your knowledge base.',
        keywords: 'how, does, work, ai, gemini, respond, answer'
    },
    
    // GETTING STARTED
    {
        content_type: 'faq',
        question: 'How do I get started?',
        answer: 'Getting started is easy! 1) Sign up for a free account, 2) Configure your chatbot appearance in the dashboard (theme color, welcome message, etc.), 3) Add your knowledge base content (FAQs, policies, product info), 4) Copy the embed script and paste it into your website HTML before the closing </body> tag. Your chatbot will be live immediately!',
        keywords: 'get, started, begin, setup, install, first, steps'
    },
    {
        content_type: 'faq',
        question: 'How do I embed the chatbot on my website?',
        answer: 'To embed the chatbot, go to your dashboard and click on the "Embed Script" tab. Copy the provided JavaScript code and paste it into your website HTML, just before the closing </body> tag. The script works on any website platform including WordPress, Shopify, Wix, and custom HTML sites. The chatbot will appear as a floating button in the bottom corner of your page.',
        keywords: 'embed, install, add, website, script, html, integrate, integration'
    },
    
    // PRICING
    {
        content_type: 'faq',
        question: 'Is there a free trial?',
        answer: 'Yes! We offer a free trial so you can test all features of the platform before committing. During the trial, you have full access to the chatbot dashboard, knowledge base management, and analytics. No credit card required to start.',
        keywords: 'free, trial, test, demo, try, pricing'
    },
    {
        content_type: 'faq',
        question: 'What are the pricing plans?',
        answer: 'We offer flexible pricing plans to suit businesses of all sizes. Our plans are based on the number of conversations per month. Visit our pricing page for detailed information, or contact our sales team for enterprise solutions. All plans include unlimited knowledge base entries and basic analytics.',
        keywords: 'pricing, plans, cost, price, subscription, payment'
    },
    
    // FEATURES
    {
        content_type: 'faq',
        question: 'What features are available?',
        answer: 'Our platform includes: AI-powered responses using Google Gemini, customizable chatbot appearance (colors, position, welcome message), knowledge base management for FAQs and policies, conversation analytics and history, easy embed script for any website, secure user authentication, and multi-language support through AI.',
        keywords: 'features, capabilities, what, can, do, options'
    },
    {
        content_type: 'faq',
        question: 'Can I customize the chatbot appearance?',
        answer: 'Yes! You can fully customize your chatbot appearance through the dashboard. Options include: theme color, button position (left or right), welcome message, business name, and business logo. The chatbot is designed to blend seamlessly with your brand identity.',
        keywords: 'customize, appearance, design, theme, color, logo, branding, style'
    },
    
    // KNOWLEDGE BASE
    {
        content_type: 'faq',
        question: 'How do I add content to the knowledge base?',
        answer: 'To add knowledge base content: 1) Go to your dashboard and click "Knowledge Base", 2) Fill in the form with content type (FAQ, Policy, etc.), question/topic, answer, and relevant keywords, 3) Click "Add to Knowledge Base". The AI will use this content to answer customer questions. You can add unlimited entries and edit or delete them anytime.',
        keywords: 'add, knowledge, base, content, faq, entries, create, manage'
    },
    {
        content_type: 'faq',
        question: 'What types of content can I add?',
        answer: 'You can add various types of content including: FAQs (frequently asked questions), Policies (refund, privacy, terms), Product details, Delivery information, General information, and any other content your customers might need. Each entry can include keywords to help the AI match questions accurately.',
        keywords: 'types, content, faq, policy, product, delivery, information'
    },
    
    // ANALYTICS
    {
        content_type: 'faq',
        question: 'Can I see conversation history?',
        answer: 'Yes! The Analytics tab in your dashboard shows all conversations between your chatbot and visitors. You can view the full conversation history, including user messages and bot responses, timestamps, and session IDs. This helps you understand customer needs and improve your knowledge base.',
        keywords: 'analytics, history, conversations, view, see, logs, track'
    },
    
    // SECURITY & PRIVACY
    {
        content_type: 'policy',
        question: 'Is my data secure?',
        answer: 'Yes, we take security seriously. All data is encrypted in transit using HTTPS. User passwords are hashed using bcrypt. We use JWT tokens for secure authentication. Your knowledge base content and conversation data are stored securely and are only accessible to your account. We do not share your data with third parties.',
        keywords: 'secure, security, data, encryption, safe, protect, privacy'
    },
    {
        content_type: 'policy',
        question: 'What is your privacy policy?',
        answer: 'We respect your privacy. We collect only essential data needed to provide the service. Conversation data is stored to provide analytics and improve service quality. We use cookies for authentication. We do not sell your data to third parties. For full details, please review our complete privacy policy page.',
        keywords: 'privacy, policy, data, cookies, collection, gdpr'
    },
    
    // SUPPORT
    {
        content_type: 'faq',
        question: 'How can I get help?',
        answer: 'If you need assistance, you can: 1) Check our documentation and FAQ section, 2) Contact our support team via email, 3) Use the contact form on our website. Our support team typically responds within 24 hours on business days.',
        keywords: 'help, support, contact, assistance, email, team'
    },
    {
        content_type: 'faq',
        question: 'Do you offer technical support?',
        answer: 'Yes, we provide technical support for all users. Our team can help with integration issues, API questions, and general troubleshooting. Premium plan users get priority support with faster response times.',
        keywords: 'technical, support, help, troubleshooting, api, integration'
    },
    
    // API & INTEGRATION
    {
        content_type: 'product',
        question: 'What platforms does the chatbot work with?',
        answer: 'Our chatbot works with any website platform! The embed script is pure JavaScript and works on: WordPress, Shopify, Wix, Squarespace, Webflow, custom HTML sites, React, Angular, Vue.js applications, and more. As long as you can add a script tag to your HTML, you can use our chatbot.',
        keywords: 'platforms, wordpress, shopify, wix, integration, compatible, works'
    },
    {
        content_type: 'product',
        question: 'Does the chatbot work on mobile devices?',
        answer: 'Yes! The chatbot is fully responsive and works perfectly on all devices including smartphones, tablets, and desktop computers. The chat window automatically adjusts to fit smaller screens, and the floating button is touch-friendly.',
        keywords: 'mobile, responsive, phone, tablet, device, screen'
    },
    
    // TROUBLESHOOTING
    {
        content_type: 'general',
        question: 'The chatbot is not appearing on my website',
        answer: 'If the chatbot is not appearing: 1) Make sure you copied the entire embed script, 2) Verify the script is placed before the closing </body> tag, 3) Check that your website uses HTTPS (or HTTP for localhost), 4) Clear your browser cache and refresh, 5) Check browser console for any error messages. If issues persist, contact our support team.',
        keywords: 'not, appearing, showing, visible, problem, issue, troubleshoot'
    },
    {
        content_type: 'general',
        question: 'The chatbot is not responding correctly',
        answer: 'If the chatbot is not responding correctly: 1) Add more specific content to your knowledge base, 2) Include relevant keywords for each entry, 3) Make sure your questions and answers are clear and detailed, 4) The AI may need more context - try adding more knowledge base entries. You can also review conversation analytics to see what questions are being asked.',
        keywords: 'not, responding, wrong, incorrect, answer, problem, issue'
    }
];

async function seedKnowledgeBase(userId) {
    try {
        console.log(`Seeding knowledge base for user ID: ${userId}`);
        
        // Find the user's chatbot
        const chatbot = await Chatbot.findByUserId(userId);
        
        if (!chatbot) {
            console.log('No chatbot found for this user. Creating a default chatbot...');
            await Chatbot.create(userId, 'Customer Support', 'support@example.com');
            const newChatbot = await Chatbot.findByUserId(userId);
            
            if (!newChatbot) {
                console.error('Failed to create chatbot.');
                process.exit(1);
            }
            
            console.log(`Created chatbot with ID: ${newChatbot.id}`);
            return seedKnowledgeBaseWithChatbotId(newChatbot.id);
        }
        
        console.log(`Found chatbot with ID: ${chatbot.id}`);
        return seedKnowledgeBaseWithChatbotId(chatbot.id);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

async function seedKnowledgeBaseWithChatbotId(chatbotId) {
    try {
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const item of knowledgeBaseContent) {
            try {
                await Chatbot.addKnowledge(
                    chatbotId,
                    item.content_type,
                    item.question,
                    item.answer,
                    item.keywords
                );
                addedCount++;
                console.log(`✓ Added: "${item.question}"`);
            } catch (error) {
                skippedCount++;
                console.log(`- Skipped (may already exist): "${item.question}"`);
            }
        }
        
        console.log(`\n========================================`);
        console.log(`Knowledge base seeding complete!`);
        console.log(`Added: ${addedCount} entries`);
        console.log(`Skipped: ${skippedCount} entries`);
        console.log(`========================================`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error adding knowledge:', error);
        process.exit(1);
    }
}

// Main execution
const userId = process.argv[2];

if (!userId) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Knowledge Base Seeder for Chatbot Platform         ║
╚══════════════════════════════════════════════════════════════╝

Usage: node scripts/seed-knowledge-base.js <user_id>

Example: node scripts/seed-knowledge-base.js 1

This script will populate your chatbot's knowledge base with 
pre-defined content about the Customer Support Chatbot platform.

To find your user ID, you can:
1. Check your database: SELECT id, email FROM users;
2. Or look at the URL after logging in to the dashboard
`);
    process.exit(0);
}

seedKnowledgeBase(userId);