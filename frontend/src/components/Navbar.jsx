import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Navbar.css'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const userDropdownRef = useRef(null)
  const adminDropdownRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true'
    setDarkMode(saved)
    if (saved) {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    setUserDropdownOpen(false)
    navigate('/login')
  }

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev)
  }

  const closeMobile = () => {
    setMobileOpen(false)
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    const first = user.first_name || ''
    const last = user.last_name || ''
    if (first && last) return (first[0] + last[0]).toUpperCase()
    if (first) return first[0].toUpperCase()
    if (last) return last[0].toUpperCase()
    return 'U'
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/videos', label: 'Videos', icon: '🎬' },
  ]

  const userMenuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/referrals', label: 'Referrals', icon: '👥' },
    { to: '/withdrawals', label: 'Withdrawals', icon: '💰' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ]

const adminMenuItems = [
    { to: '/admin', label: 'Admin Dashboard', icon: '📋' },
    { to: '/admin/users', label: 'Manage Users', icon: '👥' },
    { to: '/admin/videos', label: 'Manage Videos', icon: '🎥' },
    { to: '/admin/companies', label: 'Manage Companies', icon: '🏢' },
    { to: '/admin/withdrawals', label: 'Manage Withdrawals', icon: '💳' },
  ]

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <Link to="/" className="navbar-brand" onClick={closeMobile}>
            <div className="navbar-brand-icon">VR</div>
            <span>Video Rewards Rwanda</span>
          </Link>

          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  end={link.to === '/'}
                >
                  <span className="nav-link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-link-icon">📊</span>
                  Dashboard
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-link-icon">📋</span>
                  Admin
                </NavLink>
              </li>
            )}
          </ul>

          <div className="navbar-actions">
            <button
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <div className="user-menu">
                <div className="user-avatar" title={user?.first_name || 'User'}>
                  {getUserInitials()}
                </div>
                <span className="user-name">
                  {user?.first_name || 'User'}
                </span>

                <div className="dropdown" ref={userDropdownRef}>
                  <button
                    className="dropdown-toggle"
                    onClick={() => {
                      setUserDropdownOpen((prev) => !prev)
                      setAdminDropdownOpen(false)
                    }}
                    aria-label="User menu"
                  >
                    <span className="dropdown-toggle-icon">▾</span>
                  </button>
                  <ul className="dropdown-menu">
                    {userMenuItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className="dropdown-item"
                          onClick={() => {
                            setUserDropdownOpen(false)
                            setMobileOpen(false)
                          }}
                          end={item.to === '/dashboard'}
                        >
                          <span className="dropdown-item-icon">{item.icon}</span>
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                    <li className="dropdown-divider" />
                    <li>
                      <button className="dropdown-item dropdown-item-logout" onClick={handleLogout}>
                        <span className="dropdown-item-icon">🚪</span>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline" onClick={closeMobile}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMobile}>
                  Register
                </Link>
              </div>
            )}

            <button
              className={`hamburger ${mobileOpen ? 'open' : ''}`}
              onClick={toggleMobile}
              aria-label="Toggle navigation menu"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={closeMobile}
      />

      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMobile}
                  end={link.to === '/'}
                >
                  <span className="mobile-nav-link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMobile}
                >
                  <span className="mobile-nav-link-icon">📊</span>
                  Dashboard
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <>
                <li className="mobile-divider" />
                {adminMenuItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `mobile-nav-link ${isActive ? 'active' : ''}`
                      }
                      onClick={closeMobile}
                      end={item.to === '/admin'}
                    >
                      <span className="mobile-nav-link-icon">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </>
            )}
            {isAuthenticated ? (
              <>
                <li className="mobile-divider" />
                <li className="mobile-user-section">
                  <div className="mobile-user-name">
                    {user?.first_name || 'User'}
                  </div>
                  <div className="mobile-auth-buttons">
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="btn btn-outline"
                        onClick={closeMobile}
                      >
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <button className="btn btn-outline" onClick={handleLogout}>
                      🚪 Logout
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <li className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-outline" onClick={closeMobile}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMobile}>
                  Register
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  )
}

export default Navbar