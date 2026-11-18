import nodemailer from 'nodemailer'

export const sendVerificationEmail = async (email, code, purpose) => {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM.')
    error.status = 503
    throw error
  }

  const auth = process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    ...(auth ? { auth } : {}),
  })

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your Video Rewards Rwanda security code',
      text: [
        `Your security code is ${code}.`,
        purpose === 'email_change'
          ? 'Enter this code to confirm your new email address.'
          : 'Enter this code to authorize an account settings change or verify your email.',
        'This code expires in 10 minutes. If you did not request it, you can ignore this message.',
      ].join('\n\n'),
    })
  } catch (cause) {
    const error = new Error('The verification email could not be sent.')
    error.status = 503
    error.cause = cause
    throw error
  }
}
