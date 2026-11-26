import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import pool from '../config/db.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 bytes of random secret material.');
}

const JWT_OPTIONS = { expiresIn: '1h', algorithm: 'HS256', issuer: 'video-rewards-rwanda', audience: 'video-rewards-rwanda-api' };
const REGISTRATION_FEE = 4750;
const DATABASE_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_NO_SUCH_TABLE',
]);

export const register = async (req, res) => {
  try {
    // Accept both camelCase (from frontend) and snake_case field names
    const {
      first_name: fn,
      last_name: ln,
      phone_number: pn,
      referral_code: rc,
      firstName: fn2,
      lastName: ln2,
      phone: phone2,
      referralCode: rc2,
      email,
      password,
    } = req.body;

    const first_name = fn || fn2;
    const last_name = ln || ln2;
    const phone_number = pn || phone2;
    const referral_code = rc || rc2;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedFirstName = String(first_name || '').trim();
    const normalizedLastName = String(last_name || '').trim();
    const normalizedPhone = String(phone_number || '').trim();

    if (!normalizedFirstName || normalizedFirstName.length > 50 ||
        !normalizedLastName || normalizedLastName.length > 50) {
      return res.status(400).json({ message: 'Enter a valid first and last name.' });
    }
    if (!/^\\S+@\\S+\\.\\S+$/.test(normalizedEmail) || normalizedEmail.length > 100) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!/^[\\d\\s+\\-()]{7,15}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Enter a valid phone number.' });
    }
    if (typeof password !== 'string' || password.length < 12 ||
        Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Password must be at least 12 characters and no more than 72 UTF-8 bytes.' });
    }

    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingPhone = await User.findByPhone(normalizedPhone);
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    let referred_by = null;
    if (referral_code) {
      const referrer = await User.findByReferralCode(referral_code);
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referred_by = referrer.id;
    }

    // Create the account and its pending registration obligation atomically.
    // Referral rewards are withheld until a trusted provider confirms payment.
    const connection = await pool.getConnection();
    let user;
    try {
      await connection.beginTransaction();
      user = await User.create({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        password,
        referred_by
      }, connection);
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'registration', REGISTRATION_FEE, 'Registration fee awaiting verified payment-provider confirmation', 'pending']
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, JWT_OPTIONS);

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    if (DATABASE_UNAVAILABLE_CODES.has(error.code)) {
      return res.status(503).json({
        message: 'Registration is temporarily unavailable because the database is not ready. Please try again later.',
      });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.findByPhone(email);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, JWT_OPTIONS);

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
