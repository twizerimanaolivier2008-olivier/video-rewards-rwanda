import pool from '../config/db.js';

const Withdrawal = {
  async create(withdrawalData) {
    const { user_id, amount, payment_method, phone_number, status = 'pending' } = withdrawalData;
    const [result] = await pool.query(
      'INSERT INTO withdrawals (user_id, amount, payment_method, phone_number, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, amount, payment_method, phone_number, status]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM withdrawals WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const [rows] = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  async findByStatus(status) {
    const [rows] = await pool.query(
      'SELECT * FROM withdrawals WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    return rows;
  },

  async updateStatus(id, status, processed_by = null) {
    if (processed_by) {
      await pool.query('UPDATE withdrawals SET status = ?, processed_by = ?, processed_at = NOW() WHERE id = ?', [status, processed_by, id]);
    } else {
      await pool.query('UPDATE withdrawals SET status = ? WHERE id = ?', [status, id]);
    }
    return this.findById(id);
  },

  async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT w.*, u.first_name, u.last_name, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM withdrawals');
    return rows[0].count;
  }
};

export default Withdrawal;
