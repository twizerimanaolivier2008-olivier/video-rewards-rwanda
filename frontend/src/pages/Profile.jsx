import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import './Auth.css'

const Profile = () => {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone_number || '',
      })
    }
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🔒</div>
            <h1 className="auth-title">Please Log In</h1>
            <p className="auth-subtitle">You need to be logged in to view your profile.</p>
          </div>
          <Link to="/login" className="btn-submit" style={{ textAlign: 'center', display: 'block' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')
    setSaved(false)

    try {
      const updated = await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
      })
      success('Profile updated successfully!')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile'
      setSubmitError(message)
      error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">👤</div>
          <h1 className="auth-title">My Profile</h1>
          <p className="auth-subtitle">Manage your account information</p>
        </div>

        {submitError && <div className="auth-error-banner">{submitError}</div>}
        {saved && <div className="auth-success-banner">Profile saved successfully!</div>}

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
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <div
              style={{
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                background: '#f9fafb',
                fontSize: '0.9rem',
                color: '#374151',
                textTransform: 'capitalize',
              }}
            >
              {user?.role || 'user'}
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/dashboard">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}

export default Profile