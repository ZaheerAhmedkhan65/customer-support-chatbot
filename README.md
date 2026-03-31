# AI Customer Support Chatbot

A full-stack AI-powered customer support chatbot that can be embedded on any website. Built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

- **Chatbot Dashboard**: Configure your chatbot's appearance and behavior
- **Knowledge Base**: Add FAQs, policies, and product information for the chatbot to use
- **Embeddable Widget**: Easy-to-embed chatbot script for any website
- **AI-Powered Responses**: Uses Google Gemini API for intelligent responses
- **Conversation Analytics**: View chat history and customer interactions
- **Customizable Design**: Theme colors, button position, and welcome messages

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens) with httpOnly cookies
- **AI**: Google Gemini API
- **Frontend**: EJS templates, vanilla JavaScript, CSS

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
2. Click "Sign Up" and create an account
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

## Project Structure

```
customer-support-chatbot/
├── config/
│   └── database.js      # Database configuration
├── middleware/
│   └── auth.js          # Authentication middleware
├── models/
│   ├── Chatbot.js       # Chatbot model
│   ├── Conversation.js  # Conversation model
│   └── User.js          # User model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── chatbot.js       # Chatbot API routes
│   ├── chat.js          # Chat API routes
│   └── embed.js         # Embed routes
├── services/
│   └── geminiService.js # Google Gemini AI service
├── views/
│   ├── dashboard.ejs    # Dashboard page
│   ├── index.ejs        # Landing page
│   ├── signin.ejs       # Sign in page
│   └── signup.ejs       # Sign up page
├── assets/
│   └── styles.css       # Dashboard styles
├── server.js            # Main server file
└── package.json
├── public
├── chatbot.js           # Embeddable chatbot widget
├── chatbot.css          # Chatbot styles
└── widget.html          # Widget template
├── README.md
```

## API Endpoints

### Authentication
- `GET /auth/signup` - Sign up page
- `POST /auth/signup` - Create account
- `GET /auth/signin` - Sign in page
- `POST /auth/signin` - Authenticate user
- `GET /auth/logout` - Logout user

### Chatbot Settings
- `GET /api/chatbot/settings` - Get chatbot configuration
- `POST /api/chatbot/settings` - Update chatbot settings

### Knowledge Base
- `POST /api/chatbot/knowledge` - Add knowledge base item
- `POST /api/chatbot/knowledge/:id` - Delete knowledge base item

### Chat
- `POST /api/chat/message` - Send chat message

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR | Primary key |
| org_id | VARCHAR | Organization ID |
| email | VARCHAR | User email |
| password | VARCHAR | Hashed password |
| created_at | DATETIME | Account creation date |

### Chatbots Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | VARCHAR | Foreign key to users |
| business_name | VARCHAR | Business name |
| business_email | VARCHAR | Business email |
| theme_color | VARCHAR | Chatbot theme color |
| button_position | VARCHAR | Button position (left/right) |
| welcome_message | TEXT | Welcome message |
| is_active | BOOLEAN | Active status |

### Knowledge Base Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| chatbot_id | INT | Foreign key to chatbots |
| content_type | VARCHAR | Type (faq, policy, etc.) |
| question | VARCHAR | Question/topic |
| answer | TEXT | Answer content |
| keywords | TEXT | Search keywords |

### Conversations Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| chatbot_id | INT | Foreign key to chatbots |
| session_id | VARCHAR | Session identifier |
| user_message | TEXT | User's message |
| bot_response | TEXT | Bot's response |
| created_at | DATETIME | Message timestamp |

## Security Features

- **httpOnly Cookies**: JWT tokens stored in secure httpOnly cookies
- **Password Hashing**: bcrypt for password security
- **CORS Protection**: Configured for cross-origin requests
- **Rate Limiting**: Protection against abuse
- **Helmet.js**: Security headers
- **Content Security Policy**: XSS protection

## License

MIT License