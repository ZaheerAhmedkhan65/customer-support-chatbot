const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiKey = require('../models/ApiKey');

class GeminiService {
    constructor() {
        this.currentKeyId = null;
        this.genAI = null;
        this.model = null;
    }

    async loadActiveKey() {
        try {
            const keys = await ApiKey.findActiveByService('gemini');
            if (keys.length === 0) {
                this.genAI = null;
                this.model = null;
                this.currentKeyId = null;
                return false;
            }

            const key = keys[0];
            this.genAI = new GoogleGenerativeAI(key.key_value);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            this.currentKeyId = key.id;
            return true;
        } catch (error) {
            console.error('Failed to load Gemini API key:', error);
            this.genAI = null;
            this.model = null;
            this.currentKeyId = null;
            return false;
        }
    }

    async rotateKey(errorMessage = '') {
        const lower = (errorMessage || '').toLowerCase();
        const likelyQuota = lower.includes('quota') || lower.includes('rate limit') || lower.includes('429') || lower.includes('resource exhausted');

        if (!likelyQuota && this.genAI) {
            return false;
        }

        if (!this.currentKeyId) {
            return false;
        }

        try {
            const current = await ApiKey.findById(this.currentKeyId);
            if (!current) return false;

            const next = await ApiKey.findNextActive('gemini', current.id);
            if (!next) {
                const first = await ApiKey.findFirstActive('gemini');
                if (!first || first.id === current.id) return false;
                this.genAI = new GoogleGenerativeAI(first.key_value);
                this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                this.currentKeyId = first.id;
                return true;
            }

            this.genAI = new GoogleGenerativeAI(next.key_value);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            this.currentKeyId = next.id;
            return true;
        } catch (error) {
            console.error('Failed to rotate Gemini API key:', error);
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isRetryableError(error) {
        const message = (error.message || '').toLowerCase();
        if (message.includes('fetch failed') || message.includes('econnreset') || message.includes('etimedout') || message.includes('network')) {
            return true;
        }
        if (message.includes('429') || message.includes('too many requests') || message.includes('rate limit') || message.includes('resource exhausted')) {
            return true;
        }
        if (message.includes('500') || message.includes('503') || message.includes('internal server error') || message.includes('service unavailable')) {
            return true;
        }
        if (error.status && [429, 500, 502, 503, 504].includes(error.status)) {
            return true;
        }
        return false;
    }

    extractRetryDelay(error) {
        const match = (error.message || '').match(/retry in (\d+\.?\d*)s/);
        if (match) {
            return Math.ceil(parseFloat(match[1]) * 1000);
        }
        return null;
    }

    async callWithRetry(fn, maxRetries = 4) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.error(`Gemini API attempt ${attempt + 1} failed:`, error.message);
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                const retryDelay = this.extractRetryDelay(error);
                const delayMs = retryDelay !== null ? retryDelay : Math.min(1000 * Math.pow(2, attempt), 10000);
                await this.delay(delayMs);

                if (this.isRetryableError(error) && (error.message || '').includes('429')) {
                    const rotated = await this.rotateKey(error.message || '');
                    if (rotated) {
                        console.log('Rotated API key after rate limit');
                    }
                }
            }
        }
        throw lastError;
    }

    async generateResponse(prompt, context = "") {
        if (!this.model) {
            const loaded = await this.loadActiveKey();
            console.log('Gemini API key loaded:', loaded);
            if (!loaded) {
                return "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.";
            }
        }
        console.log("prompt", prompt)
        try {
            const fullPrompt = `${context}\n\nUser question: ${prompt}\n\nPlease provide a helpful, accurate response based on the context above. If the information is not available, politely say so and offer general assistance.`;

            const result = await this.callWithRetry(() => this.model.generateContent(fullPrompt));
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API error after retries:', error);
            const rotated = await this.rotateKey(error.message || '');
            if (rotated) {
                try {
                    await this.delay(1000);
                    const fullPrompt = `${context}\n\nUser question: ${prompt}\n\nPlease provide a helpful, accurate response based on the context above. If the information is not available, politely say so and offer general assistance.`;
                    const result = await this.model.generateContent(fullPrompt);
                    const response = await result.response;
                    return response.text();
                } catch (retryError) {
                    console.error('Gemini API error after key rotation:', retryError);
                }
            }
            return "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.";
        }
    }

    async generateContent(prompt) {
        if (!this.model) {
            const loaded = await this.loadActiveKey();
            if (!loaded) {
                return { text: "I apologize, but I'm having trouble generating content right now. Please try again later." };
            }
        }

        try {
            const result = await this.callWithRetry(() => this.model.generateContent(prompt));
            const response = await result.response;
            return { text: response.text() };
        } catch (error) {
            console.error('Gemini API error after retries:', error);
            const rotated = await this.rotateKey(error.message || '');
            if (rotated) {
                try {
                    await this.delay(1000);
                    const result = await this.model.generateContent(prompt);
                    const response = await result.response;
                    return { text: response.text() };
                } catch (retryError) {
                    console.error('Gemini API error after key rotation:', retryError);
                }
            }
            return { text: "I apologize, but I'm having trouble generating content right now. Please try again later." };
        }
    }

    buildContext(knowledgeBase) {
        let context = "You are a helpful customer support assistant. Use the following information to answer customer questions:\n\n";

        knowledgeBase.forEach(item => {
            if (item.question && item.answer) {
                context += `Q: ${item.question}\nA: ${item.answer}\n\n`;
            } else if (item.answer) {
                context += `${item.content_type.toUpperCase()}: ${item.answer}\n\n`;
            }
        });

        context += "Be friendly, professional, and helpful. Keep responses concise but informative.\n";
        return context;
    }
}

module.exports = new GeminiService();