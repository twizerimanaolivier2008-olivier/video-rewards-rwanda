import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import './Auth.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    if (!email.trim()) {
      setSubmitError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setSubmitError('Please enter a valid email address')
      return false
    }
    setSubmitError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email')
      }
      setSubmitted(true)
      success('Password reset link sent to your email!')
    } catch (err) {
      const message = err.message || 'Something went wrong. Please try again.'
      setSubmitError(message)
      error(message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📧</div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
          </div>
          <div className="auth-success-banner">If you don't see the email, check your spam folder.</div>
          <Link to="/login" className="btn-submit" style={{ textAlign: 'center', display: 'block' }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>
        </div>

        {submitError && <div className="auth-error-banner">{submitError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className={`form-input ${submitError ? 'error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setSubmitError('')
              }}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword