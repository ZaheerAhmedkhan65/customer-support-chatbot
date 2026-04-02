# Customer Support Chatbot

A AI-powered customer support chatbot that can be embedded on any website. Built for modern businesses looking to provide 24/7 support without the need for a large team.

## Features

- **Chatbot Dashboard**: Configure your chatbot's appearance and behavior
- **Knowledge Base**: Add FAQs, policies, and product information for the chatbot to use
- **Embeddable Widget**: Easy-to-embed chatbot script for any website
- **AI-Powered Responses**: Uses Google Gemini API for intelligent responses
- **Conversation Analytics**: View chat history and customer interactions
- **Customizable Design**: Theme colors, button position, and welcome messages

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd customer-support-chatbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Create a MySQL database and update the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and Gemini API key:

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key
```

### 4. Run database migrations

The database tables will be created automatically on first run. The following tables are created:

- `users` - User accounts
- `chatbots` - Chatbot configurations
- `knowledge_base` - FAQ and knowledge base content
- `conversations` - Chat conversation history

### 5. Start the server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Usage

### 1. Create an Account

1. Visit `http://localhost:3000`
2. Click "Start Free Trial" and create an account
3. You'll be redirected to the dashboard

### 2. Configure Your Chatbot

In the dashboard, you can:

- **Chatbot Settings**: Set business name, email, theme color, button position, and welcome message
- **Knowledge Base**: Add FAQs, policies, and other content for the chatbot
- **Embed Script**: Get the code to embed on your website
- **Analytics**: View conversation history

### 3. Embed on Your Website

Copy the embed script from the dashboard and paste it before the closing `</body>` tag of your website:

```html
<script src="http://localhost:3000/chatbot.js" data-org-id="your-org-id"></script>
```

## License

MIT License