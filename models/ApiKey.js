const pool = require('../config/database');

class ApiKey {
    static async create({ service, key_value, name = '', is_active = true }) {
        const [result] = await pool.execute(
            `INSERT INTO api_keys (service, key_value, name, is_active) 
             VALUES (?, ?, ?, ?)`,
            [service, key_value, name, is_active ? 1 : 0]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM api_keys WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByService(service) {
        const [rows] = await pool.execute(
            'SELECT * FROM api_keys WHERE service = ? ORDER BY id ASC',
            [service]
        );
        return rows;
    }

    static async findActiveByService(service) {
        const [rows] = await pool.execute(
            'SELECT * FROM api_keys WHERE service = ? AND is_active = 1 ORDER BY id ASC',
            [service]
        );
        return rows;
    }

    static async findNextActive(service, currentId) {
        const [rows] = await pool.execute(
            'SELECT * FROM api_keys WHERE service = ? AND is_active = 1 AND id > ? ORDER BY id ASC LIMIT 1',
            [service, currentId]
        );
        return rows[0] || null;
    }

    static async findFirstActive(service) {
        const [rows] = await pool.execute(
            'SELECT * FROM api_keys WHERE service = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [service]
        );
        return rows[0] || null;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.key_value !== undefined) {
            fields.push('key_value = ?');
            values.push(data.key_value);
        }
        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(data.is_active ? 1 : 0);
        }
        
        if (fields.length === 0) return;
        
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async deactivate(id) {
        const [result] = await pool.execute(
            'UPDATE api_keys SET is_active = 0 WHERE id = ?',
            [id]
        );
        return result;
    }

    static async activate(id) {
        const [result] = await pool.execute(
            'UPDATE api_keys SET is_active = 1 WHERE id = ?',
            [id]
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM api_keys WHERE id = ?', [id]);
        return result;
    }

    static async countActive(service) {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM api_keys WHERE service = ? AND is_active = 1',
            [service]
        );
        return rows[0].count;
    }

    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM api_keys ORDER BY service, id ASC');
        return rows;
    }
}

module.exports = ApiKey;