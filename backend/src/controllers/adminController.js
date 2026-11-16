import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';
import VideoView from '../models/VideoView.js';
import Company from '../models/Company.js';

const toCamelCase = (obj) => {
  const camelObj = {};
  for (const key in obj) {
    if (key === '_id') continue;
    if (key === 'password_hash') continue;
    let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === 'first_name') camelKey = 'firstName';
    if (key === 'last_name') camelKey = 'lastName';
    if (key === 'phone_number') camelKey = 'phoneNumber';
    if (key === 'account_type') camelKey = 'accountType';
    if (key === 'referred_by') camelKey = 'referredBy';
    if (key === 'referral_code') camelKey = 'referralCode';
    if (key === 'total_earned') camelKey = 'totalEarned';
    if (key === 'total_withdrawn') camelKey = 'totalWithdrawn';
    if (key === 'created_at') camelKey = 'createdAt';
    if (key === 'updated_at') camelKey = 'updatedAt';
    if (key === 'is_active') camelKey = 'isActive';
    if (key === 'payment_method') camelKey = 'paymentMethod';
    if (key === 'processed_by') camelKey = 'processedBy';
    if (key === 'duration_seconds') camelKey = 'duration';
    if (key === 'video_url') camelKey = 'videoUrl';
    if (key === 'thumbnail_url') camelKey = 'thumbnail';
    if (key === 'reward_points') camelKey = 'rewardPoints';
    if (key === 'reward_amount') camelKey = 'rewardAmount';
    if (key === 'max_views') camelKey = 'maxViews';
    if (key === 'current_views') camelKey = 'currentViews';
    if (key === 'watch_duration') camelKey = 'watchDuration';
    if (key === 'earned_points') camelKey = 'earnedPoints';
    if (key === 'earned_amount') camelKey = 'earnedAmount';
    camelObj[camelKey] = obj[key];
  }
  return camelObj;
};

const toCamelCaseArray = (arr) => arr.map(toCamelCase);

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const users = await User.getAllUsers(page, limit);
    res.json(toCamelCaseArray(users));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const videos = await Video.getAll(page, limit);
    res.json(toCamelCaseArray(videos));
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVideoStats = async (req, res) => {
  try {
    const totalVideos = await Video.getCount();
    const totalViewsResult = await pool.query('SELECT SUM(current_views) as total_views FROM videos');
    const totalViews = totalViewsResult[0].total_views || 0;

    res.json({ totalVideos, totalViews });
  } catch (error) {
    console.error('Video stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createVideo = async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url, category, duration_seconds, reward_points, reward_amount, is_active, max_views } = req.body;
    const videoData = {
      title,
      description,
      video_url: video_url || req.body.videoUrl,
      thumbnail_url: thumbnail_url || req.body.thumbnail,
      category,
      duration_seconds: duration_seconds || req.body.duration,
      reward_points: reward_points || req.body.rewardPoints,
      reward_amount: reward_amount || 0,
      is_active: is_active !== undefined ? is_active : true,
      max_views: max_views || 1000,
      advertiser_id: req.user.id
    };
    const video = await Video.create(videoData);
    res.status(201).json(toCamelCase(video));
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url, category, duration_seconds, reward_points, reward_amount, is_active, max_views } = req.body;
    const videoData = {
      title,
      description,
      video_url: video_url || req.body.videoUrl,
      thumbnail_url: thumbnail_url || req.body.thumbnail,
      category,
      duration_seconds: duration_seconds || req.body.duration,
      reward_points: reward_points || req.body.rewardPoints,
      reward_amount: reward_amount || 0,
      is_active: is_active !== undefined ? is_active : true,
      max_views: max_views || 1000
    };
    const video = await Video.update(req.params.id, videoData);
    res.json(toCamelCase(video));
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    await pool.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;

    let withdrawals;
    if (status) {
      withdrawals = await Withdrawal.findByStatus(status);
    } else {
      withdrawals = await Withdrawal.getAll(page, limit);
    }

    const camelCased = withdrawals.map(w => ({
      ...w,
      paymentMethod: w.payment_method,
      phoneNumber: w.phone_number,
      userId: w.user_id,
      processedBy: w.processed_by,
      createdAt: w.created_at,
      updatedAt: w.updated_at
    }));
    res.json(camelCased);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const processWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reference } = req.body;
    const processedBy = req.user.id;

    const withdrawal = await Withdrawal.updateStatus(id, status, processedBy);
    if (reference) {
      await pool.query('UPDATE withdrawals SET reference = ? WHERE id = ?', [reference, id]);
    }

    if (status === 'completed') {
      await User.updateWithdrawn(withdrawal.user_id, withdrawal.amount);
    }

    const camelCasedWithdrawal = {
      ...withdrawal,
      paymentMethod: withdrawal.payment_method,
      phoneNumber: withdrawal.phone_number,
      userId: withdrawal.user_id,
      processedBy: withdrawal.processed_by,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at
    };

    res.json({ message: 'Withdrawal updated successfully', withdrawal: camelCasedWithdrawal });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.getCount();
    const totalVideos = await Video.getCount();

    const totalViewsResult = await pool.query('SELECT SUM(current_views) as total_views FROM videos');
    const totalViews = totalViewsResult[0].total_views || 0;

    const pendingWithdrawalsResult = await pool.query(
      'SELECT COUNT(*) as pending_count FROM withdrawals WHERE status = ?',
      ['pending']
    );
    const pendingWithdrawals = pendingWithdrawalsResult[0].pending_count || 0;
    const withdrawalsResult = await pool.query('SELECT SUM(amount) as total_amount FROM withdrawals WHERE status = "completed"');
    const totalWithdrawn = withdrawalsResult[0].total_amount || 0;

res.json({
      totalUsers,
      totalVideos,
      totalViews,
      pendingWithdrawals,
      totalWithdrawn
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== USER MANAGEMENT (Admin) ====================

export const createUser = async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone_number, password,
      firstName, lastName, phone, role = 'user', account_type = 'free'
    } = req.body;

    const fn = first_name || firstName;
    const ln = last_name || lastName;
    const pn = phone_number || phone;

    if (!fn || !ln || !email || !pn || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingPhone = await User.findByPhone(pn);
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const user = await User.create({
      first_name: fn,
      last_name: ln,
      email,
      phone_number: pn,
      password,
      account_type
    });

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, user.id]);

    const updated = await User.findById(user.id);
    const { password_hash, ...userWithoutPassword } = updated;
    res.status(201).json({ message: 'User created successfully', user: toCamelCase(userWithoutPassword) });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone_number, role, account_type, is_active
    } = req.body;

    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      const dup = await User.findByEmail(email);
      if (dup && dup.id !== Number(id)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (phone_number) {
      const dup = await User.findByPhone(phone_number);
      if (dup && dup.id !== Number(id)) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    await pool.query(
      `UPDATE users SET
         first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         email = COALESCE(?, email),
         phone_number = COALESCE(?, phone_number),
         role = COALESCE(?, role),
         account_type = COALESCE(?, account_type),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [first_name || null, last_name || null, email || null, phone_number || null, role || null, account_type || null, is_active === undefined ? null : is_active, id]
    );

    const updated = await User.findById(id);
    const { password_hash, ...userWithoutPassword } = updated;
    res.json({ message: 'User updated successfully', user: toCamelCase(userWithoutPassword) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newStatus = existing.is_active ? false : true;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    const updated = await User.findById(id);
    const { password_hash, ...userWithoutPassword } = updated;
    res.json({ message: 'User status updated', user: toCamelCase(userWithoutPassword) });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== COMPANY MANAGEMENT (Admin) ====================

export const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || null;

    const companies = await Company.findAll(page, limit, search);
    const camelCased = companies.map((c) => ({
      ...c,
      logoUrl: c.logo_url,
      contactPerson: c.contact_person,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));
    res.json(camelCased);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCompany = async (req, res) => {
  try {
    const {
      name, email, phone, website, logo_url, logoUrl, description, contact_person, is_active
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    if (email) {
      const dup = await Company.findByEmail(email);
      if (dup) {
        return res.status(400).json({ message: 'Company with this email already exists' });
      }
    }

    const company = await Company.create({
      name,
      email,
      phone,
      website,
      logo_url: logo_url || logoUrl || null,
      description,
      contact_person,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, website, logo_url, logoUrl, description, contact_person, is_active
    } = req.body;

    const existing = await Company.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (email) {
      const dup = await Company.findByEmail(email);
      if (dup && dup.id !== Number(id)) {
        return res.status(400).json({ message: 'Company with this email already exists' });
      }
    }

    const company = await Company.update(id, {
      name: name || existing.name,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      website: website !== undefined ? website : existing.website,
      logo_url: logo_url !== undefined ? (logo_url || logoUrl) : existing.logo_url,
      description: description !== undefined ? description : existing.description,
      contact_person: contact_person !== undefined ? contact_person : existing.contact_person,
      is_active: is_active !== undefined ? is_active : existing.is_active
    });

    res.json({ message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Company.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await Company.remove(id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
