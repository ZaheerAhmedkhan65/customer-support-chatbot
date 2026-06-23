// routes/crawler.js
const authenticate = require('../middleware/auth');
const Chatbot = require('../models/Chatbot');
const CrawlerService = require('../services/crawlerService');
const router = require('./base')();

// Crawl website and discover useful pages
router.post('/crawl-website', authenticate, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Website URL is required'
            });
        }

        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format. Please enter a valid website URL.'
            });
        }

        console.log(`Crawling website: ${parsedUrl.href}`);

        // Discover useful links
        const usefulLinks = await CrawlerService.discoverUsefulLinks(parsedUrl.href);

        if (usefulLinks.length === 0) {
            return res.json({
                success: true,
                entries: [],
                message: 'No useful pages found on this website. Try a different URL.'
            });
        }

        console.log(`Found ${usefulLinks.length} useful pages, extracting content...`);

        // Generate knowledge entries from the discovered pages
        const entries = await CrawlerService.generateKnowledgeEntries(usefulLinks);

        res.json({
            success: true,
            entries,
            totalLinks: usefulLinks.length,
            totalEntries: entries.length
        });

    } catch (error) {
        console.error('Crawl website error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to crawl website'
        });
    }
});

// Save crawled entries to knowledge base
router.post('/crawl-website/save', authenticate, async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No entries provided to save'
            });
        }

        let chatbot = await Chatbot.findByUserId(req.user.id);

        if (!chatbot) {
            await Chatbot.create(req.user.id, '', '');
            chatbot = await Chatbot.findByUserId(req.user.id);
        }

        // Limit to 50 entries
        const limitedEntries = entries.slice(0, 50);
        
        // Format entries for bulk import (remove source_url which is internal to crawler)
        const knownTypes = new Set(['faq','policy','delivery','refund','product','general','shipping','pricing','account','technical','billing','security','returns','warranty','installation','integration','compliance','training','maintenance']);
        const knowledgeEntries = limitedEntries.map(entry => {
            const raw = (entry.content_type || '').toLowerCase();
            const safe = knownTypes.has(raw) ? entry.content_type : 'general';
            return {
                content_type: safe,
                question: entry.question,
                answer: entry.answer,
                keywords: entry.keywords
            };
        });
        let addedCount = 0;
        for (const entry of knowledgeEntries) {
            await Chatbot.addKnowledge(chatbot.id, entry.content_type, entry.question, entry.answer, entry.keywords);
            addedCount++;
        }

        res.json({
            success: true,
            addedCount,
            message: `Successfully imported ${addedCount} knowledge base entries from website!`
        });

    } catch (error) {
        console.error('Save crawled entries error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save crawled entries'
        });
    }
});

module.exports = router;