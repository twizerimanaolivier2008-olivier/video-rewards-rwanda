import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 bytes of random secret material.');
}

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.slice(7).trim();
    if (!token || token.length > 4096) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'video-rewards-rwanda',
      audience: 'video-rewards-rwanda-api',
    });

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number, role, account_type,
              referral_code, referred_by, points, balance, total_earned,
              total_withdrawn, is_verified, is_active, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [decoded.user_id]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid token. User is unavailable.' });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

export { authenticateUser };
