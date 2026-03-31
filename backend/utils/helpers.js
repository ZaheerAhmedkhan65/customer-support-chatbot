const crypto = require('crypto');

// Generate unique ID with prefix
function generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    if (!input) return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Format date for display
function formatDate(date, format = 'datetime') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'date':
            return `${year}-${month}-${day}`;
        case 'time':
            return `${hours}:${minutes}:${seconds}`;
        case 'datetime':
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        default:
            return d.toLocaleString();
    }
}

// Truncate text to specified length
function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + suffix;
}

// Extract keywords from text
function extractKeywords(text) {
    const stopWords = new Set([
        'a', 'an', 'and', 'or', 'but', 'so', 'for', 'nor', 'of', 'to', 'in', 'on', 'at',
        'with', 'without', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
        'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did',
        'doing', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could'
    ]);

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const keywords = words.filter(word => !stopWords.has(word) && word.length > 2);
    return [...new Set(keywords)];
}

// Calculate response time in milliseconds
function calculateResponseTime(startTime) {
    return Date.now() - startTime;
}

// Create session ID
function createSessionId() {
    return 'sess_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
}

// Validate URL format
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Escape HTML special characters
function escapeHtml(text) {
    if (!text) return '';
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, match => htmlEscapes[match]);
}

// Unescape HTML
function unescapeHtml(text) {
    if (!text) return '';
    const htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };
    return text.replace(/&(?:amp|lt|gt|quot|#39);/g, match => htmlUnescapes[match]);
}

// Validate password strength
function isStrongPassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && (hasUpperCase || hasLowerCase) && hasNumbers;
}

// Generate random token
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Sleep/delay function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] +