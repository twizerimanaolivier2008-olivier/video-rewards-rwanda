import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../config/db.js'
import User from '../models/User.js'
import {
  AccountSecurityError,
  consumeVerificationCode,
  issueVerificationCode,
  maskEmail,
  verifyVerificationCode,
} from '../utils/accountVerification.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const avatarsDirectory = path.join(__dirname, '../uploads/avatars')
const validEmail = /^\S+@\S+\.\S+$/
const validPhone = /^[\d\s+\-()]{7,15}$/
const extensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const respondWithError = (res, error, context, fallbackMessage) => {
  if (error instanceof AccountSecurityError || (error.status >= 400 && error.status < 500)) {
    return res.status(error.status).json({ message: error.message })
  }
  console.error(`${context}:`, error)
  return res.status(error.status || 500).json({
    message: error.status === 503 ? error.message : fallbackMessage,
  })
}

const validateCodeRequestEmail = async (email, userId) => {
  if (!validEmail.test(email)) {
    throw new AccountSecurityError(400, 'Enter a valid new email address.')
  }
  const existingUser = await User.findByEmail(email)
  if (existingUser && existingUser.id !== userId) {
    throw new AccountSecurityError(409, 'That email address is already in use.')
  }
}

export const requestProfileVerificationCodes = async (req, res) => {
  try {
    const currentEmail = String(req.user.email).trim().toLowerCase()
    const submittedEmail = String(req.body.newEmail || '').trim().toLowerCase()
    const emailIsChanging = Boolean(submittedEmail && submittedEmail !== currentEmail)

    if (emailIsChanging) await validateCodeRequestEmail(submittedEmail, req.user.id)

    let currentCode
    let newEmailHint = ''
    try {
      currentCode = await issueVerificationCode(req.user.id, currentEmail, 'account_change')
      if (emailIsChanging) {
        const newEmailCode = await issueVerificationCode(req.user.id, submittedEmail, 'email_change')
        newEmailHint = newEmailCode.emailHint
      } else {
        await pool.query(
          'DELETE FROM account_email_verification_codes WHERE user_id = ? AND purpose = ?',
          [req.user.id, 'email_change']
        )
      }
    } catch (error) {
      if (currentCode) {
        try {
          await pool.query(
            'DELETE FROM account_email_verification_codes WHERE user_id = ? AND purpose = ? AND code_hash = ?',
            [req.user.id, 'account_change', currentCode.codeHash]
          )
        } catch (cleanupError) {
          console.error('Failed to remove a partial account verification request:', cleanupError)
        }
      }
      throw error
    }

    res.json({
      message: emailIsChanging
        ? `Security codes were sent to ${currentCode.emailHint} and ${newEmailHint}.`
        : `A security code was sent to ${currentCode.emailHint}.`,
      emailHint: currentCode.emailHint,
      newEmailHint,
      requiresNewEmailCode: emailIsChanging,
    })
  } catch (error) {
    respondWithError(res, error, 'Request profile verification codes error', 'Could not send verification codes.')
  }
}

export const verifyProfileEmail = async (req, res) => {
  try {
    const codeHash = await verifyVerificationCode(
      req.user.id,
      'account_change',
      req.user.email,
      req.body.verificationCode
    )
    await consumeVerificationCode(req.user.id, 'account_change', codeHash)
    await pool.query('UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ?', [req.user.id])
    res.json(await User.findById(req.user.id))
  } catch (error) {
    respondWithError(res, error, 'Verify profile email error', 'Could not verify this email address.')
  }
}

export const updateProfile = async (req, res) => {
  try {
    const firstName = String(req.body.first_name ?? req.body.firstName ?? '').trim()
    const lastName = String(req.body.last_name ?? req.body.lastName ?? '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const phoneNumber = String(req.body.phone_number ?? req.body.phone ?? '').trim()
    const currentEmail = String(req.user.email).toLowerCase()
    const emailIsChanging = email !== currentEmail

    if (!firstName || !lastName || !email || !phoneNumber) {
      throw new AccountSecurityError(400, 'Name, email, and phone number are required.')
    }
    if (!validEmail.test(email)) {
      throw new AccountSecurityError(400, 'Enter a valid email address.')
    }
    if (!validPhone.test(phoneNumber)) {
      throw new AccountSecurityError(400, 'Enter a valid phone number.')
    }

    const existingEmail = await User.findByEmail(email)
    if (existingEmail && existingEmail.id !== req.user.id) {
      throw new AccountSecurityError(409, 'That email address is already in use.')
    }
    const existingPhone = await User.findByPhone(phoneNumber)
    if (existingPhone && existingPhone.id !== req.user.id) {
      throw new AccountSecurityError(409, 'That phone number is already in use.')
    }
    if (emailIsChanging && !req.body.newEmailVerificationCode) {
      throw new AccountSecurityError(400, 'Enter the code sent to your new email address.')
    }

    const currentCodeHash = await verifyVerificationCode(
      req.user.id,
      'account_change',
      currentEmail,
      req.body.verificationCode
    )
    const newEmailCodeHash = emailIsChanging
      ? await verifyVerificationCode(
        req.user.id,
        'email_change',
        email,
        req.body.newEmailVerificationCode
      )
      : null

    await consumeVerificationCode(req.user.id, 'account_change', currentCodeHash)
    if (newEmailCodeHash) {
      await consumeVerificationCode(req.user.id, 'email_change', newEmailCodeHash)
    }

    await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone_number = ?,
           email_verified_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [firstName, lastName, email, phoneNumber, req.user.id]
    )

    res.json(await User.findById(req.user.id))
  } catch (error) {
    respondWithError(res, error, 'Update profile error', 'Failed to update profile.')
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, verificationCode } = req.body
    if (!currentPassword || !newPassword) {
      throw new AccountSecurityError(400, 'Current and new passwords are required.')
    }
    if (newPassword.length < 12) {
      throw new AccountSecurityError(400, 'New password must be at least 12 characters.')
    }
    if (currentPassword === newPassword) {
      throw new AccountSecurityError(400, 'Choose a new password different from your current password.')
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
    if (!rows.length) {
      throw new AccountSecurityError(404, 'User not found.')
    }
    if (!await bcrypt.compare(currentPassword, rows[0].password_hash)) {
      throw new AccountSecurityError(400, 'Current password is incorrect.')
    }

    const codeHash = await verifyVerificationCode(
      req.user.id,
      'account_change',
      req.user.email,
      verificationCode
    )
    await consumeVerificationCode(req.user.id, 'account_change', codeHash)
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP) WHERE id = ?',
      [passwordHash, req.user.id]
    )
    res.json({
      message: 'Password changed successfully.',
      user: await User.findById(req.user.id),
    })
  } catch (error) {
    respondWithError(res, error, 'Change password error', 'Failed to change password.')
  }
}

export const uploadProfileAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Choose a profile photo to upload.' })
  }

  let avatarPath
  let avatarPersisted = false
  try {
    const codeHash = await verifyVerificationCode(
      req.user.id,
      'account_change',
      req.user.email,
      req.body.verificationCode
    )
    const extension = extensionsByMimeType[req.file.mimetype]
    if (!extension) {
      throw new AccountSecurityError(400, 'Choose a JPG, PNG, or WebP image.')
    }

    await fs.mkdir(avatarsDirectory, { recursive: true })
    const filename = `${randomBytes(16).toString('hex')}${extension}`
    avatarPath = path.join(avatarsDirectory, filename)
    await fs.writeFile(avatarPath, req.file.buffer, { flag: 'wx' })
    await consumeVerificationCode(req.user.id, 'account_change', codeHash)
    await pool.query(
      `UPDATE users
       SET profile_image_url = ?,
           email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
       WHERE id = ?`,
      [`/api/auth/profile-photo/${filename}`, req.user.id]
    )
    avatarPersisted = true
    res.json(await User.findById(req.user.id))
  } catch (error) {
    if (avatarPath && !avatarPersisted) {
      try {
        await fs.unlink(avatarPath)
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Failed to clean up an incomplete profile photo upload:', cleanupError)
        }
      }
    }
    respondWithError(res, error, 'Upload profile photo error', 'Could not update the profile photo.')
  }
}

export const getProfilePhoto = (req, res) => {
  const { filename } = req.params
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(filename)) {
    return res.status(404).json({ message: 'Profile photo not found.' })
  }

  const photoPath = path.join(avatarsDirectory, filename)
  res.sendFile(photoPath, (error) => {
    if (error && !res.headersSent) {
      if (error.statusCode === 404) {
        res.status(404).json({ message: 'Profile photo not found.' })
        return
      }
      console.error('Serve profile photo error:', error)
      res.status(500).json({ message: 'Could not load the profile photo.' })
    }
  })
}
