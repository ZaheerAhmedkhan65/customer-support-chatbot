const pool = require('../config/database');

class ContactMessage {
    static async create({ name, email, subject, message }) {
        const [result] = await pool.execute(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES (?, ?, ?, ?)`,
            [name, email, subject, message]
        );
        return result.insertId;
    }

    static async getRecent() {
        const [rows] = await pool.execute(
            `SELECT id, name, email, subject, message, created_at
             FROM contact_messages
             ORDER BY created_at DESC, id DESC
             LIMIT 100`
        );
        return rows;
    }
}

module.exports = ContactMessage;
