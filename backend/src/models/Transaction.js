import pool from '../config/db.js';

const Transaction = {
  async create(transactionData) {
    const { user_id, type, amount, description, status = 'completed' } = transactionData;
    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, type, amount, description, status]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByUserId(user_id, limit = 50) {
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [user_id, limit]
    );
    return rows;
  },

  async findByUserIdAndType(user_id, type) {
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
      [user_id, type]
    );
    return rows;
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE transactions SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
};

export default Transaction;
