const pool  = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(email, password) {
        const org_id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (org_id, email, password) VALUES (?, ?, ?)',
            [org_id, email, hashedPassword]
        );

        return { id: result.insertId, org_id, email };
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT id, org_id, email, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = User;