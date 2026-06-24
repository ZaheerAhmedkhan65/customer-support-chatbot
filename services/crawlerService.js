// services/crawlerService.js
const axios = require('axios');
const cheerio = require('cheerio');

class CrawlerService {

    /**
     * Extract useful internal links from a website
     * @param {string} url - The base URL to crawl
     * @returns {Promise<Array<{url: string, title: string, type: string}>>}
     */
    async discoverUsefulLinks(url) {
        try {
            const baseUrl = new URL(url);
            const baseHost = baseUrl.hostname;

            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
                    'Accept': 'text/html,application/xhtml+xml'
                }
            });

            const $ = cheerio.load(response.data);
            const links = [];

            // Known useful path patterns - ordered by specificity (general last)
            const usefulPatterns = [
                { pattern: /faq|f-a-q|frequently.asked|questions/i, type: 'faq' },
                { pattern: /policy|policies/i, type: 'policy' },
                { pattern: /privacy|privacy.policy/i, type: 'security' },
                { pattern: /terms|terms.of.service|terms.and.conditions/i, type: 'compliance' },
                { pattern: /shipping|delivery|ship/i, type: 'shipping' },
                { pattern: /return|refund|exchange|cancellation/i, type: 'returns' },
                { pattern: /pricing|price|plan|subscription/i, type: 'pricing' },
                { pattern: /warranty|guarantee/i, type: 'warranty' },
                { pattern: /install|setup|getting.started|guide|tutorial/i, type: 'installation' },
                { pattern: /billing|invoice|payment/i, type: 'billing' },
                { pattern: /maintenance|upkeep|care/i, type: 'maintenance' },
                { pattern: /integration|api|developer/i, type: 'integration' },
                { pattern: /contact|support|help|get.help/i, type: 'general' },
                { pattern: /about|about.us/i, type: 'general' },
                { pattern: /.+/i, type: 'general' } // catch-all for anything else
            ];

            // Also include the homepage itself
            links.push({
                url: baseUrl.origin,
                title: $('title').text().trim() || 'Homepage',
                type: 'general'
            });

            $('a[href]').each((i, el) => {
                const $el = $(el);
                let href = $el.attr('href');
                const linkText = $el.text().trim().toLowerCase();

                if (!href) return;

                // Convert relative URLs to absolute
                try {
                    href = new URL(href, baseUrl.origin).href;
                } catch {
                    return;
                }

                // Only internal links
                const linkUrl = new URL(href);
                if (linkUrl.hostname !== baseHost) return;

                // Skip anchors, javascript, mailto, tel
                if (href.includes('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

                // Skip the base URL itself (already added)
                if (href === baseUrl.origin || href === baseUrl.origin + '/') return;

                // Skip file downloads
                if (href.match(/\.(pdf|zip|rar|doc|docx|xls|xlsx|jpg|png|gif|mp4|mp3)$/i)) return;

                // Skip common non-content paths
                if (href.match(/\/(wp-content|wp-admin|wp-includes|wp-json|cdn-cgi)\//i)) return;

                const pathname = linkUrl.pathname;

                // Check if this link matches any useful pattern
                for (const { pattern, type } of usefulPatterns) {
                    if (pattern.test(pathname) || pattern.test(linkText)) {
                        // Avoid duplicates
                        if (!links.some(l => l.url === href)) {
                            links.push({
                                url: href,
                                title: $el.text().trim() || pathname.split('/').filter(Boolean).pop() || 'Page',
                                type
                            });
                        }
                        break;
                    }
                }
            });

            // Limit to 10 useful pages max
            return links.slice(0, 10);
        } catch (error) {
            console.error('Crawler discovery error:', error.message);
            throw new Error(`Failed to crawl website: ${error.message}`);
        }
    }

    /**
     * Extract structured content from a page
     * @param {string} url - The page URL
     * @returns {Promise<{title: string, content: string, headings: string[]}>}
     */
    async extractPageContent(url) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
                    'Accept': 'text/html,application/xhtml+xml'
                }
            });

            const $ = cheerio.load(response.data);

            // Remove script, style, nav, footer, header elements
            $('script, style, nav, footer, header, .sidebar, .menu, .nav, noscript, iframe, svg, form, button, input').remove();

            const title = $('title').text().trim() || new URL(url).pathname.split('/').filter(Boolean).pop() || 'Page';

            // Extract headings for structure
            const headings = [];
            $('h1, h2, h3').each((i, el) => {
                const text = $(el).text().trim();
                if (text) headings.push(text);
            });

            // Extract main content - prefer <main> or <article> or <section>
            let contentEl = $('main').first();
            if (!contentEl.length) contentEl = $('article').first();
            if (!contentEl.length) contentEl = $('[role="main"]').first();
            if (!contentEl.length) contentEl = $('.content, .post, .page-content, .entry-content, #content').first();
            if (!contentEl.length) contentEl = $('body');

            let content = '';

            // Extract paragraphs
            contentEl.find('p, li, td, blockquote, .faq-answer, .accordion-body').each((i, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 20) {
                    content += text + '\n\n';
                }
            });

            // If content is too short, try extracting all text from content element
            if (content.length < 100) {
                content = contentEl.text().trim();
                // Clean up whitespace
                content = content.replace(/\s+/g, ' ').trim();
            }

            // Truncate to max 5000 chars per page
            if (content.length > 5000) {
                content = content.substring(0, 5000) + '...';
            }

            return { title, content, headings };
        } catch (error) {
            console.error(`Crawler extract error for ${url}:`, error.message);
            return { title: new URL(url).pathname.split('/').filter(Boolean).pop() || 'Page', content: '', headings: [] };
        }
    }

    /**
     * Generate knowledge base entries from crawled page content
     * Uses the page title/headings to create a question/topic and content as the answer
     * @param {Array} pages - Array of {url, title, type} from discoverUsefulLinks
     * @returns {Promise<Array<{content_type: string, question: string, answer: string, keywords: string}>>}
     */
    async generateKnowledgeEntries(pages) {
        const entries = [];

        for (const page of pages) {
            try {
                const { title, content, headings } = await this.extractPageContent(page.url);

                if (!content || content.length < 20) continue;

                // Generate a meaningful question/topic from the title and headings
                let question = title;
                if (headings.length > 0 && headings[0].toLowerCase() !== title.toLowerCase()) {
                    question = headings[0];
                }

                // Clean up question
                question = question.replace(/\s+/g, ' ').trim();
                if (question.length > 200) question = question.substring(0, 200);

                // Auto-generate keywords from content
                const stopWords = new Set([
                    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for', 'of', 'with',
                    'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
                    'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
                    'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
                    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'been', 'being', 'do', 'does',
                    'did', 'doing', 'would', 'should', 'could', 'will', 'may', 'might', 'shall', 'can', 'need', 'dare',
                    'ought', 'used', 'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
                    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
                    'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'who', 'whom', 'this', 'that',
                    'these', 'those', 'am', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'having'
                ]);

                const words = content.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !stopWords.has(word));

                const uniqueWords = [...new Set(words)].slice(0, 10);
                const keywords = uniqueWords.join(', ');

                // Determine content type - constrain to DB-safe ENUM values only
                let contentType = page.type;
                const safeTypes = new Set(['faq', 'policy', 'general']);
                if (!safeTypes.has(contentType)) contentType = 'general';
                // If type is 'general' and headings contain FAQ-like patterns, change to 'faq'
                if (contentType === 'general' && /faq|frequently asked|question|answer/i.test(title + ' ' + headings.join(' '))) {
                    contentType = 'faq';
                }

                entries.push({
                    content_type: contentType,
                    question,
                    answer: content.substring(0, 4000),
                    keywords,
                    source_url: page.url
                });

                // Add a small delay between page fetches to be polite
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Error processing ${page.url}:`, err.message);
                continue;
            }
        }

        return entries;
    }
}

module.exports = new CrawlerService();