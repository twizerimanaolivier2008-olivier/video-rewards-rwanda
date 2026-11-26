import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

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

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingPhone = await User.findByPhone(phone_number);
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

    const user = await User.create({
      first_name,
      last_name,
      email,
      phone_number,
      password,
      referred_by
    });

    // Registration is not proof of payment. Keep the fee pending and do not
    // credit referral rewards until a trusted provider confirmation is implemented.
    await Transaction.create({
      user_id: user.id,
      type: 'registration',
      amount: REGISTRATION_FEE,
      description: 'Registration fee awaiting verified payment-provider confirmation',
      status: 'pending'
    });

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
