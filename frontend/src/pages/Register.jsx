import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { register } from '../utils/auth'
import './Auth.css'

const getPasswordStrength = (password) => {
  let score = 0
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return { level: 'weak', label: 'Weak', colorClass: 'weak', score }
  if (score === 3) return { level: 'fair', label: 'Fair', colorClass: 'fair', score }
  if (score === 4) return { level: 'good', label: 'Good', colorClass: 'good', score }
  return { level: 'strong', label: 'Strong', colorClass: 'strong', score }
}

const Register = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null

  const validate = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s+\-()]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 12 characters'
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    } else if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions'
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
      const { confirmPassword, agreeTerms, ...registerData } = formData
      await register({
        ...registerData,
        email: registerData.email.trim().toLowerCase(),
        phone: registerData.phone.trim(),
        referralCode: registerData.referralCode.trim(),
      })
      success('Account created successfully! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      setSubmitError(message)
      error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-story" aria-label="About Video Rewards Rwanda">
        <span className="auth-eyebrow">Your next chapter starts here</span>
        <h2>Join in. Watch. Earn.</h2>
        <p>Create your account to explore videos, follow your rewards, and invite friends to join the community.</p>
        <ul className="auth-benefits">
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>A personal dashboard for your activity</li>
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>Referral tools to share with friends</li>
          <li><span className="auth-benefit-check" aria-hidden="true">✓</span>Secure sign-in and account controls</li>
        </ul>
      </section>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand"><div className="auth-logo">VR</div><span>Video Rewards Rwanda</span></div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">A few details and you’re ready to get started.</p>
        </div>

        {submitError && <div className="auth-error-banner" role="alert">{submitError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={`form-input ${errors.firstName ? 'error' : ''}`}
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={`form-input ${errors.lastName ? 'error' : ''}`}
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
              />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="+250 788 123 456"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="referralCode" className="form-label">Referral code <span className="form-hint">(optional)</span></label>
            <input
              type="text"
              id="referralCode"
              name="referralCode"
              className={`form-input ${errors.referralCode ? 'error' : ''}`}
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="Enter a friend's code"
              autoComplete="off"
              aria-invalid={Boolean(errors.referralCode)}
            />
            {errors.referralCode && <span className="form-error">{errors.referralCode}</span>}
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
                placeholder="At least 12 characters"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
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
            {errors.password && <span className="form-error">{errors.password}</span>}
            {passwordStrength && (
              <>
                <div className="password-strength" aria-label={`Password strength: ${passwordStrength.label}`} role="meter" aria-valuemin={0} aria-valuemax={5} aria-valuenow={passwordStrength.score}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div key={index} className={`password-strength-bar ${index < passwordStrength.score ? passwordStrength.colorClass : ''}`} />
                  ))}
                </div>
                <span className={`password-strength-text ${passwordStrength.colorClass}`}>
                  {passwordStrength.label}
                </span>
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="form-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <label className="checkbox-group">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              aria-invalid={Boolean(errors.agreeTerms)}
            />
            <span className="checkbox-label">
              I confirm that my information is accurate and agree to create an account.
            </span>
          </label>
          {errors.agreeTerms && <span className="form-error">{errors.agreeTerms}</span>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default Register