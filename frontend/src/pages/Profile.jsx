import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import api from '../utils/api'
import './Profile.css'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatCurrency = (amount) => new Intl.NumberFormat('rw-RW', {
  style: 'currency',
  currency: 'RWF',
  maximumFractionDigits: 0,
}).format(Number(amount) || 0)

const requestSecurityCode = (newEmail) => api.post(
  '/auth/profile/verification-code',
  newEmail ? { newEmail } : {}
)

const Profile = () => {
  const { user, isAuthenticated, updateProfile, syncUser, logout } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileCodes, setProfileCodes] = useState({ currentEmail: '', newEmail: '' })
  const [profileCodesSent, setProfileCodesSent] = useState(false)
  const [profileCodeStatus, setProfileCodeStatus] = useState('')
  const [profileCodeLoading, setProfileCodeLoading] = useState(false)
  const [emailVerificationCode, setEmailVerificationCode] = useState('')
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [emailVerificationStatus, setEmailVerificationStatus] = useState('')
  const [emailVerificationError, setEmailVerificationError] = useState(false)
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
  const [passwordVerificationCode, setPasswordVerificationCode] = useState('')
  const [passwordCodeSent, setPasswordCodeSent] = useState(false)
  const [passwordCodeStatus, setPasswordCodeStatus] = useState('')
  const [passwordCodeLoading, setPasswordCodeLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarVerificationCode, setAvatarVerificationCode] = useState('')
  const [avatarCodeSent, setAvatarCodeSent] = useState(false)
  const [avatarCodeStatus, setAvatarCodeStatus] = useState('')
  const [avatarCodeLoading, setAvatarCodeLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        email: user.email || '',
        phone: user.phone_number || user.phoneNumber || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return undefined
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile])

  const handleProfileChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }))
    setSubmitError('')
    if (event.target.name === 'email') {
      setProfileCodesSent(false)
      setProfileCodeStatus('')
      setProfileCodes({ currentEmail: '', newEmail: '' })
    }
  }

  const requestProfileCodes = async () => {
    const currentEmail = String(user?.email || '').trim().toLowerCase()
    const newEmail = formData.email.trim().toLowerCase()
    setSubmitError('')
    setProfileCodeStatus('')
    setProfileCodeLoading(true)
    try {
      const response = await requestSecurityCode(newEmail !== currentEmail ? newEmail : '')
      setProfileCodesSent(true)
      setProfileCodes({ currentEmail: '', newEmail: '' })
      setProfileCodeStatus(response.data.message)
      success('Security code sent. Check your email.')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not send security codes.'
      setSubmitError(message)
      error(message)
    } finally {
      setProfileCodeLoading(false)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setSubmitError('Please complete all profile fields.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setSubmitError('Enter a valid email address.')
      return
    }
    if (!/^[\d\s+\-()]{7,15}$/.test(formData.phone.trim())) {
      setSubmitError('Enter a valid phone number.')
      return
    }
    if (!profileCodesSent) {
      setSubmitError('Request a security code before saving account details.')
      return
    }
    if (!/^\d{6}$/.test(profileCodes.currentEmail.trim())) {
      setSubmitError('Enter the 6-digit code sent to your current email.')
      return
    }

    const emailIsChanging = formData.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase()
    if (emailIsChanging && !/^\d{6}$/.test(profileCodes.newEmail.trim())) {
      setSubmitError('Enter the 6-digit code sent to your new email address.')
      return
    }

    setLoading(true)
    try {
      await updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        verificationCode: profileCodes.currentEmail.trim(),
        newEmailVerificationCode: emailIsChanging ? profileCodes.newEmail.trim() : '',
      })
      setProfileCodesSent(false)
      setProfileCodes({ currentEmail: '', newEmail: '' })
      setProfileCodeStatus('')
      success('Profile updated successfully.')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Failed to update profile.'
      setSubmitError(message)
      error(message)
    } finally {
      setLoading(false)
    }
  }

  const requestEmailVerificationCode = async () => {
    setEmailVerificationStatus('')
    setEmailVerificationError(false)
    setEmailVerificationLoading(true)
    try {
      const response = await requestSecurityCode()
      setEmailVerificationSent(true)
      setEmailVerificationCode('')
      setEmailVerificationStatus(response.data.message)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not send the verification code.'
      setEmailVerificationStatus(message)
      setEmailVerificationError(true)
      error(message)
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  const handleVerifyEmail = async (event) => {
    event.preventDefault()
    setEmailVerificationStatus('')
    setEmailVerificationError(false)
    if (!/^\d{6}$/.test(emailVerificationCode.trim())) {
      setEmailVerificationStatus('Enter the 6-digit code from your email.')
      setEmailVerificationError(true)
      return
    }

    setEmailVerificationLoading(true)
    try {
      const response = await api.post('/auth/profile/verify-email', {
        verificationCode: emailVerificationCode.trim(),
      })
      syncUser(response.data.user || response.data)
      setEmailVerificationSent(false)
      setEmailVerificationCode('')
      setEmailVerificationStatus('Your email address is verified.')
      success('Email address verified.')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not verify this email address.'
      setEmailVerificationStatus(message)
      setEmailVerificationError(true)
      error(message)
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  const handlePasswordChange = (event) => {
    setPasswordData((previous) => ({ ...previous, [event.target.name]: event.target.value }))
    setPasswordError('')
  }

  const requestPasswordCode = async () => {
    setPasswordError('')
    setPasswordCodeStatus('')
    setPasswordCodeLoading(true)
    try {
      const response = await requestSecurityCode()
      setPasswordCodeSent(true)
      setPasswordVerificationCode('')
      setPasswordCodeStatus(response.data.message)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not send a security code.'
      setPasswordError(message)
      error(message)
    } finally {
      setPasswordCodeLoading(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError('')
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }
    if (!passwordCodeSent || !/^\d{6}$/.test(passwordVerificationCode.trim())) {
      setPasswordError('Request and enter the 6-digit security code sent to your email.')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await api.put('/auth/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        verificationCode: passwordVerificationCode.trim(),
      })
      if (response.data.user) syncUser(response.data.user)
      success(response.data.message || 'Password changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordVerificationCode('')
      setPasswordCodeSent(false)
      setPasswordCodeStatus('')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Failed to change password.'
      setPasswordError(message)
      error(message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarSelection = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarFile(null)
      setAvatarError('Choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarFile(null)
      setAvatarError('Your profile photo must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setAvatarFile(file)
    setAvatarError('')
  }

  const requestAvatarCode = async () => {
    setAvatarError('')
    setAvatarCodeStatus('')
    setAvatarCodeLoading(true)
    try {
      const response = await requestSecurityCode()
      setAvatarCodeSent(true)
      setAvatarVerificationCode('')
      setAvatarCodeStatus(response.data.message)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not send a security code.'
      setAvatarError(message)
      error(message)
    } finally {
      setAvatarCodeLoading(false)
    }
  }

  const handleAvatarSubmit = async (event) => {
    event.preventDefault()
    setAvatarError('')
    if (!avatarFile) {
      setAvatarError('Choose a profile photo first.')
      return
    }
    if (!avatarCodeSent || !/^\d{6}$/.test(avatarVerificationCode.trim())) {
      setAvatarError('Request and enter the 6-digit security code sent to your email.')
      return
    }

    const payload = new FormData()
    payload.append('avatar', avatarFile)
    payload.append('verificationCode', avatarVerificationCode.trim())
    setAvatarLoading(true)
    try {
      const response = await api.put('/auth/profile/avatar', payload)
      syncUser(response.data.user || response.data)
      setAvatarFile(null)
      setAvatarVerificationCode('')
      setAvatarCodeSent(false)
      setAvatarCodeStatus('')
      success('Profile photo updated.')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not update the profile photo.'
      setAvatarError(message)
      error(message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) {
    return (
      <main className="profile-page profile-message">
        <h1>Sign in to manage your account</h1>
        <Link to="/login" className="profile-primary-link">Go to login</Link>
      </main>
    )
  }

  const joinedAt = user?.created_at || user?.createdAt
  const balance = Number(user?.balance || 0)
  const accountIsActive =
    user?.is_active !== false && user?.is_active !== 0 && user?.isActive !== false && user?.isActive !== 0
  const emailIsVerified = Boolean(user?.email_verified_at || user?.emailVerifiedAt)

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <span className="profile-eyebrow">Account settings</span>
          <h1>My account</h1>
          <p>Update your personal information, review your rewards, and keep your account secure.</p>
        </div>
        <button type="button" className="profile-logout" onClick={handleLogout}>Sign out</button>
      </header>

      <div className="profile-grid">
        <aside className="profile-card profile-overview">
          <div className="profile-avatar" aria-hidden="true">
            {user?.profile_image_url || user?.profileImageUrl
              ? <img src={user.profile_image_url || user.profileImageUrl} alt="" />
              : (user?.first_name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h2>{[user?.first_name || user?.firstName, user?.last_name || user?.lastName].filter(Boolean).join(' ') || 'Account holder'}</h2>
          <p className="profile-email">{user?.email}</p>
          <span className={`profile-status ${accountIsActive ? '' : 'inactive'}`}>
            {accountIsActive ? 'Active account' : 'Inactive'}
          </span>

          <section className="profile-email-verification" aria-label="Email verification">
            <div className="profile-verification-heading">
              <span className={`profile-verification-indicator ${emailIsVerified ? 'verified' : ''}`} aria-hidden="true">
                {emailIsVerified ? '✓' : '!'}
              </span>
              <div>
                <strong>{emailIsVerified ? 'Email verified' : 'Verify your email'}</strong>
                <small>
                  {emailIsVerified
                    ? 'Your account email is confirmed.'
                    : 'Confirm your email to protect account changes.'}
                </small>
              </div>
            </div>
            {!emailIsVerified && !emailVerificationSent && (
              <button
                type="button"
                className="profile-secondary-button"
                onClick={requestEmailVerificationCode}
                disabled={emailVerificationLoading}
              >
                {emailVerificationLoading ? 'Sending code…' : 'Send verification code'}
              </button>
            )}
            {emailVerificationSent && (
              <form className="profile-email-code-form" onSubmit={handleVerifyEmail}>
                <label className="form-group">
                  <span className="form-label">6-digit email code</span>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={emailVerificationCode}
                    onChange={(event) => setEmailVerificationCode(event.target.value.replace(/\D/g, ''))}
                    required
                  />
                </label>
                <button type="submit" className="profile-primary-button" disabled={emailVerificationLoading}>
                  {emailVerificationLoading ? 'Verifying…' : 'Confirm email'}
                </button>
              </form>
            )}
            {emailVerificationStatus && (
              <p className={`profile-code-status ${emailVerificationError ? 'error' : ''}`} role="status">
                {emailVerificationStatus}
              </p>
            )}
          </section>

          <dl className="profile-details">
            <div><dt>Account type</dt><dd>{user?.account_type || user?.accountType || 'free'}</dd></div>
            <div><dt>Role</dt><dd>{user?.role || 'user'}</dd></div>
            <div><dt>Verification</dt><dd>{user?.is_verified || user?.isVerified ? 'Verified' : 'Not verified'}</dd></div>
            <div><dt>Member since</dt><dd>{formatDate(joinedAt)}</dd></div>
            <div><dt>Referral code</dt><dd>{user?.referral_code || user?.referralCode || '—'}</dd></div>
          </dl>

          <div className="profile-rewards">
            <div><span>Points</span><strong>{Number(user?.points || 0).toLocaleString()}</strong></div>
            <div><span>Available balance</span><strong>{formatCurrency(balance)}</strong></div>
            <div><span>Total earned</span><strong>{formatCurrency(user?.total_earned || user?.totalEarned)}</strong></div>
            <div><span>Total withdrawn</span><strong>{formatCurrency(user?.total_withdrawn || user?.totalWithdrawn)}</strong></div>
          </div>
          <Link to="/dashboard" className="profile-dashboard-link">View rewards dashboard →</Link>
        </aside>

        <div className="profile-settings">
          <section className="profile-card profile-photo-card">
            <div className="profile-section-heading">
              <h2>Profile photo</h2>
              <p>Upload a JPG, PNG, or WebP image up to 5 MB. A code is required to confirm this change.</p>
            </div>
            {avatarError && <div className="profile-error" role="alert">{avatarError}</div>}
            <div className="profile-photo-layout">
              <div className="profile-avatar profile-avatar-large">
                {avatarPreview || user?.profile_image_url || user?.profileImageUrl
                  ? <img src={avatarPreview || user.profile_image_url || user.profileImageUrl} alt="Profile preview" />
                  : (user?.first_name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <form className="profile-photo-form" onSubmit={handleAvatarSubmit}>
                <label className="form-group">
                  <span className="form-label">Choose an image</span>
                  <input
                    className="profile-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelection}
                  />
                </label>
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={requestAvatarCode}
                  disabled={avatarCodeLoading || avatarLoading}
                >
                  {avatarCodeLoading ? 'Sending code…' : 'Email me a security code'}
                </button>
                {avatarCodeStatus && <p className="profile-code-status" role="status">{avatarCodeStatus}</p>}
                {avatarCodeSent && (
                  <label className="form-group">
                    <span className="form-label">6-digit security code</span>
                    <input
                      className="form-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={avatarVerificationCode}
                      onChange={(event) => setAvatarVerificationCode(event.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </label>
                )}
                <button
                  type="submit"
                  className="profile-primary-button"
                  disabled={avatarLoading || !avatarFile || !avatarCodeSent}
                >
                  {avatarLoading ? 'Uploading…' : 'Update profile photo'}
                </button>
              </form>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-section-heading">
              <h2>Personal information</h2>
              <p>These details are used for your account and payouts.</p>
            </div>
            {submitError && <div className="profile-error" role="alert">{submitError}</div>}
            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="profile-form-row">
                <label className="form-group">
                  <span className="form-label">First name</span>
                  <input className="form-input" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleProfileChange} required />
                </label>
                <label className="form-group">
                  <span className="form-label">Last name</span>
                  <input className="form-input" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleProfileChange} required />
                </label>
              </div>
              <label className="form-group">
                <span className="form-label">Email address</span>
                <input className="form-input" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleProfileChange} required />
              </label>
              <label className="form-group">
                <span className="form-label">Phone number</span>
                <input className="form-input" type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleProfileChange} required />
              </label>
              <div className="profile-code-panel">
                <div>
                  <strong>Confirm these changes</strong>
                  <p>
                    We’ll send a code to your current email.
                    {formData.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase()
                      ? ' A second code will be sent to your new email address.'
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={requestProfileCodes}
                  disabled={profileCodeLoading || loading}
                >
                  {profileCodeLoading ? 'Sending codes…' : 'Send security code'}
                </button>
                {profileCodeStatus && <p className="profile-code-status" role="status">{profileCodeStatus}</p>}
                {profileCodesSent && (
                  <div className="profile-form-row">
                    <label className="form-group">
                      <span className="form-label">Code from your current email</span>
                      <input
                        className="form-input"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={profileCodes.currentEmail}
                        onChange={(event) => setProfileCodes((previous) => ({
                          ...previous,
                          currentEmail: event.target.value.replace(/\D/g, ''),
                        }))}
                        required
                      />
                    </label>
                    {formData.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase() && (
                      <label className="form-group">
                        <span className="form-label">Code from your new email</span>
                        <input
                          className="form-input"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={profileCodes.newEmail}
                          onChange={(event) => setProfileCodes((previous) => ({
                            ...previous,
                            newEmail: event.target.value.replace(/\D/g, ''),
                          }))}
                          required
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="profile-primary-button" disabled={loading || !profileCodesSent}>
                {loading ? 'Saving…' : 'Verify and save profile'}
              </button>
            </form>
          </section>

          <section className="profile-card">
            <div className="profile-section-heading">
              <h2>Password & security</h2>
              <p>Confirm your current password before setting a new one.</p>
            </div>
            {passwordError && <div className="profile-error" role="alert">{passwordError}</div>}
            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <label className="form-group">
                <span className="form-label">Current password</span>
                <input className="form-input" type="password" name="currentPassword" autoComplete="current-password" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
              </label>
              <div className="profile-form-row">
                <label className="form-group">
                  <span className="form-label">New password</span>
                  <input className="form-input" type="password" name="newPassword" autoComplete="new-password" value={passwordData.newPassword} onChange={handlePasswordChange} minLength={8} required />
                </label>
                <label className="form-group">
                  <span className="form-label">Confirm new password</span>
                  <input className="form-input" type="password" name="confirmPassword" autoComplete="new-password" value={passwordData.confirmPassword} onChange={handlePasswordChange} minLength={8} required />
                </label>
              </div>
              <div className="profile-code-panel">
                <div>
                  <strong>Email confirmation required</strong>
                  <p>Request a code to your account email before changing your password.</p>
                </div>
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={requestPasswordCode}
                  disabled={passwordCodeLoading || passwordLoading}
                >
                  {passwordCodeLoading ? 'Sending code…' : 'Email me a security code'}
                </button>
                {passwordCodeStatus && <p className="profile-code-status" role="status">{passwordCodeStatus}</p>}
                {passwordCodeSent && (
                  <label className="form-group">
                    <span className="form-label">6-digit security code</span>
                    <input
                      className="form-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={passwordVerificationCode}
                      onChange={(event) => setPasswordVerificationCode(event.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </label>
                )}
              </div>
              <button type="submit" className="profile-primary-button" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Change password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Profile
