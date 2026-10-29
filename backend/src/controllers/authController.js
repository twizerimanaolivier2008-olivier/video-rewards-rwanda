import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import pool from '../config/db.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import ReferralEarning from '../models/ReferralEarning.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REGISTRATION_FEE = 4750;

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

    await Transaction.create({
      user_id: user.id,
      type: 'registration',
      amount: REGISTRATION_FEE,
      description: 'Premium account registration fee',
      status: 'completed'
    });

    if (referred_by) {
      await ReferralEarning.create({
        referrer_id: referred_by,
        referee_id: user.id,
        level: 1,
        points_earned: 50,
        amount_earned: 475.00
      });

      await User.updatePoints(referred_by, 50);
      await User.updateBalance(referred_by, 475.00);

      await Transaction.create({
        user_id: referred_by,
        type: 'referral_bonus',
        amount: 475.00,
        description: `Referral bonus for ${first_name} ${last_name}`,
        status: 'completed'
      });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
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

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

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

export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number } = req.body;
    const userId = req.user.id;

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (phone_number) {
      const existingPhone = await User.findByPhone(phone_number);
      if (existingPhone && existingPhone.id !== userId) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    await pool.query(
      'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone_number = COALESCE(?, phone_number) WHERE id = ?',
      [first_name, last_name, email, phone_number, userId]
    );

    const user = await User.findById(userId);
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
