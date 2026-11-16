import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { login } from '../utils/auth'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email or phone number is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')

    try {
      const user = await login(formData.email.trim(), formData.password, formData.rememberMe)
      success('Welcome back! Redirecting to dashboard...')
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.'
      setSubmitError(message)
      error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-story" aria-label="About Video Rewards Rwanda">
        <span className="auth-eyebrow">Rewards that move with you</span>
        <h2>Make every view count.</h2>
        <p>Discover local stories, watch videos you enjoy, and keep track of the rewards you earn along the way.</p>
        <ul className="auth-benefits">
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>Watch featured videos at your pace</li>
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>See your balance and activity in one place</li>
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>Invite friends and follow your referrals</li>
        </ul>
      </section>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand"><div className="auth-logo">VR</div><span>Video Rewards Rwanda</span></div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to your account.</p>
        </div>

        {submitError && <div className="auth-error-banner" role="alert">{submitError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email or Phone Number</label>
            <div className="form-input-wrapper">
              <input
                type="text"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com or +250 788 123 456"
                autoComplete="username"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
            </div>
            {errors.email && <span className="form-error" id="login-email-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="form-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="form-error" id="login-password-error">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span className="checkbox-label">Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}

export default Login