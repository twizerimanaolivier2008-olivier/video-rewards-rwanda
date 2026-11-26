import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const saltRounds = 10;

const User = {
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, profile_image_url, email_verified_at, role, account_type, referral_code, referred_by, points, balance, total_earned, total_withdrawn, is_verified, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone_number = ?',
      [phone]
    );
    return rows[0] || null;
  },

  async findByReferralCode(code) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE referral_code = ?',
      [code]
    );
    return rows[0] || null;
  },

  async create(userData, executor = pool) {
    const { first_name, last_name, email, phone_number, password, account_type = 'free', referred_by } = userData;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const referralCode = 'VR-' + randomBytes(5).toString('hex').toUpperCase();
    const [result] = await executor.query(
      'INSERT INTO users (first_name, last_name, email, phone_number, password_hash, account_type, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone_number, hashedPassword, account_type, referralCode, referred_by || null]
    );
    const [rows] = await executor.query(
      'SELECT id, first_name, last_name, email, phone_number, role, account_type, referral_code, referred_by, points, balance, total_earned, total_withdrawn, is_verified, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    return rows[0] || null;
  },

  async updatePoints(id, points) {
    await pool.query('UPDATE users SET points = points + ? WHERE id = ?', [points, id]);
    return this.findById(id);
  },

  async updateBalance(id, amount) {
    await pool.query('UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?', [amount, amount, id]);
    return this.findById(id);
  },

  async updateWithdrawn(id, amount) {
    await pool.query('UPDATE users SET total_withdrawn = total_withdrawn + ?, balance = balance - ? WHERE id = ?', [amount, amount, id]);
    return this.findById(id);
  },

  async upgradeToPremium(id) {
    await pool.query("UPDATE users SET account_type = 'premium', is_verified = TRUE WHERE id = ?", [id]);
    return this.findById(id);
  },

  async getAllUsers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, role, account_type, points, balance, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }
};

export default User;
