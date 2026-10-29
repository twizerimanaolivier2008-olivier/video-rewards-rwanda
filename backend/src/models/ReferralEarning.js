import pool from '../config/db.js';

const ReferralEarning = {
  async create(earningData) {
    const { referrer_id, referee_id, level, points_earned, amount_earned } = earningData;
    const [result] = await pool.query(
      'INSERT INTO referral_earnings (referrer_id, referee_id, level, points_earned, amount_earned) VALUES (?, ?, ?, ?, ?)',
      [referrer_id, referee_id, level, points_earned, amount_earned]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM referral_earnings WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByReferrerId(referrer_id) {
    const [rows] = await pool.query(
      'SELECT * FROM referral_earnings WHERE referrer_id = ? ORDER BY created_at DESC',
      [referrer_id]
    );
    return rows;
  },

  async getReferralStats(referrer_id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total_referrals, SUM(points_earned) AS total_points, SUM(amount_earned) AS total_earned FROM referral_earnings WHERE referrer_id = ?',
      [referrer_id]
    );
    return rows[0] || { total_referrals: 0, total_points: 0, total_earned: 0 };
  },

  async getReferralsByLevel(referrer_id) {
    const [rows] = await pool.query(
      'SELECT level, COUNT(*) as count, SUM(points_earned) as points, SUM(amount_earned) as amount FROM referral_earnings WHERE referrer_id = ? GROUP BY level',
      [referrer_id]
    );
    return rows;
  }
};

export default ReferralEarning;
