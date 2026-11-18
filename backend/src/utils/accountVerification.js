import { createHash, randomInt, timingSafeEqual } from 'crypto'
import pool from '../config/db.js'
import { sendVerificationEmail } from './emailService.js'

const CODE_LIFETIME_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_CODE_ATTEMPTS = 5

export class AccountSecurityError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'AccountSecurityError'
    this.status = status
  }
}

const hashCode = (code) => createHash('sha256').update(code).digest('hex')

export const maskEmail = (email) => {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return 'your account email'
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, name.length - 1))}@${domain}`
}

export const issueVerificationCode = async (userId, email, purpose) => {
  const [existing] = await pool.query(
    'SELECT created_at FROM account_email_verification_codes WHERE user_id = ? AND purpose = ?',
    [userId, purpose]
  )

  if (existing.length) {
    const lastSentAt = new Date(existing[0].created_at).getTime()
    if (Number.isFinite(lastSentAt) && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      throw new AccountSecurityError(429, 'Please wait one minute before requesting another security code.')
    }
  }

  const code = String(randomInt(0, 1000000)).padStart(6, '0')
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS)

  await pool.query(
    `INSERT INTO account_email_verification_codes
      (user_id, purpose, email, code_hash, attempts, expires_at, created_at)
     VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      code_hash = VALUES(code_hash),
      attempts = 0,
      expires_at = VALUES(expires_at),
      created_at = CURRENT_TIMESTAMP`,
    [userId, purpose, email, codeHash, expiresAt]
  )

  try {
    await sendVerificationEmail(email, code, purpose)
  } catch (error) {
    try {
      await pool.query(
        'DELETE FROM account_email_verification_codes WHERE user_id = ? AND purpose = ? AND code_hash = ?',
        [userId, purpose, codeHash]
      )
    } catch (cleanupError) {
      console.error('Failed to remove an undelivered account verification code:', cleanupError)
    }
    throw error
  }

  return { emailHint: maskEmail(email), codeHash }
}

export const verifyVerificationCode = async (userId, purpose, email, code) => {
  const normalizedCode = String(code || '').trim()
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new AccountSecurityError(400, 'Enter the 6-digit security code sent to your email.')
  }

  const [rows] = await pool.query(
    `SELECT email, code_hash, attempts, expires_at
     FROM account_email_verification_codes
     WHERE user_id = ? AND purpose = ?`,
    [userId, purpose]
  )
  const record = rows[0]
  if (!record) {
    throw new AccountSecurityError(400, 'The security code is missing or expired. Request a new code.')
  }

  if (String(record.email).toLowerCase() !== String(email).toLowerCase()) {
    throw new AccountSecurityError(400, 'The email address changed after the code was sent. Request a new code.')
  }

  if (new Date(record.expires_at).getTime() <= Date.now() || Number(record.attempts) >= MAX_CODE_ATTEMPTS) {
    await pool.query(
      'DELETE FROM account_email_verification_codes WHERE user_id = ? AND purpose = ?',
      [userId, purpose]
    )
    throw new AccountSecurityError(400, 'The security code expired. Request a new code.')
  }

  const suppliedHash = Buffer.from(hashCode(normalizedCode), 'hex')
  const storedHash = Buffer.from(record.code_hash, 'hex')
  if (suppliedHash.length !== storedHash.length || !timingSafeEqual(suppliedHash, storedHash)) {
    const nextAttempt = Number(record.attempts) + 1
    if (nextAttempt >= MAX_CODE_ATTEMPTS) {
      await pool.query(
        'DELETE FROM account_email_verification_codes WHERE user_id = ? AND purpose = ?',
        [userId, purpose]
      )
    } else {
      await pool.query(
        'UPDATE account_email_verification_codes SET attempts = ? WHERE user_id = ? AND purpose = ?',
        [nextAttempt, userId, purpose]
      )
    }
    throw new AccountSecurityError(400, 'That security code is incorrect. Check your email and try again.')
  }

  return record.code_hash
}

export const consumeVerificationCode = async (userId, purpose, codeHash) => {
  const [result] = await pool.query(
    `DELETE FROM account_email_verification_codes
     WHERE user_id = ? AND purpose = ? AND code_hash = ?`,
    [userId, purpose, codeHash]
  )
  if (result.affectedRows !== 1) {
    throw new AccountSecurityError(400, 'That security code has already been used. Request a new code.')
  }
}
