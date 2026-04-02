const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash" });
    }

    async generateResponse(prompt, context = "") {
        try {
            const fullPrompt = `${context}\n\nUser question: ${prompt}\n\nPlease provide a helpful, accurate response based on the context above. If the information is not available, politely say so and offer general assistance.`;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API error:', error);
            return "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.";
        }
    }

    async generateContent(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return { text: response.text() };
        } catch (error) {
            console.error('Gemini API error:', error);
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