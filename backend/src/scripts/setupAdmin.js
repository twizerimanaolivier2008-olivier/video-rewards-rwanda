import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const phone = process.env.ADMIN_PHONE?.trim();
const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Platform';
const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Admin';

try {
  if (!email || !password || !phone) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE in backend/.env.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (existingUsers.length) {
    await pool.query(
      'UPDATE users SET password_hash = ?, role = ?, is_verified = TRUE, is_active = TRUE WHERE id = ?',
      [passwordHash, 'admin', existingUsers[0].id]
    );
    console.log('Existing account promoted to admin and password updated.');
  } else {
    const [existingPhones] = await pool.query(
      'SELECT id FROM users WHERE phone_number = ? LIMIT 1',
      [phone]
    );
    if (existingPhones.length) {
      throw new Error('ADMIN_PHONE is already assigned to another account.');
    }

    const referralCode = `VR-${randomBytes(6).toString('hex').toUpperCase()}`;
    await pool.query(
      `INSERT INTO users
        (first_name, last_name, email, phone_number, password_hash, role, account_type, referral_code, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', 'premium', ?, TRUE, TRUE)`,
      [firstName, lastName, email, phone, passwordHash, referralCode]
    );
    console.log('Admin account created.');
  }
} catch (error) {
  console.error('Admin setup failed:', error.message || error.code || error.name);
  process.exitCode = 1;
} finally {
  await pool.end();
}
