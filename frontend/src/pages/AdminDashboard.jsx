import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import './AdminDashboard.css'

const managementLinks = [
  { to: '/admin/users', icon: '👥', title: 'Users', description: 'Review accounts and access' },
  { to: '/admin/videos', icon: '🎬', title: 'Videos', description: 'Manage video campaigns' },
  { to: '/admin/companies', icon: '🏢', title: 'Companies', description: 'Manage advertiser profiles' },
  { to: '/admin/withdrawals', icon: '↗', title: 'Withdrawals', description: 'Review payout requests' },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })
}

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentWithdrawals, setRecentWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [withdrawalFilter, setWithdrawalFilter] = useState('all')

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [statsResponse, usersResponse, withdrawalsResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=8'),
        api.get('/admin/withdrawals?limit=8'),
      ])
      setStats(statsResponse.data)
      setRecentUsers(Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.users || [])
      setRecentWithdrawals(
        Array.isArray(withdrawalsResponse.data)
          ? withdrawalsResponse.data
          : withdrawalsResponse.data.withdrawals || []
      )
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err)
      setLoadError(err.response?.data?.message || 'Dashboard data could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    if (!query) return recentUsers
    return recentUsers.filter((user) => {
      const name = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`
      return [name, user.email, user.phoneNumber, user.phone_number]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [recentUsers, userSearch])

  const filteredWithdrawals = useMemo(
    () => recentWithdrawals.filter((withdrawal) =>
      withdrawalFilter === 'all' || withdrawal.status === withdrawalFilter
    ),
    [recentWithdrawals, withdrawalFilter]
  )

  if (loading && !stats) {
    return (
      <div className="admin-dashboard admin-dashboard-state" role="status">
        <span className="admin-loading-indicator" />
        <p>Loading your admin overview…</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-eyebrow">Platform overview</span>
          <h1>Good to see you, Admin.</h1>
          <p>Keep an eye on activity and jump into the work that needs you.</p>
        </div>
        <button className="admin-refresh-button" type="button" onClick={fetchDashboard} disabled={loading}>
          <span aria-hidden="true">↻</span> {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </header>

      {loadError && (
        <div className="admin-load-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={fetchDashboard} disabled={loading}>Try again</button>
        </div>
      )}

      <section className="admin-stat-grid" aria-label="Platform statistics">
        <article className="admin-stat-card">
          <span className="admin-stat-icon green" aria-hidden="true">👥</span>
          <div className="admin-stat-label">Total users</div>
          <div className="admin-stat-value">{Number(stats?.totalUsers || 0).toLocaleString()}</div>
          <div className="admin-stat-note">Registered accounts</div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon blue" aria-hidden="true">▶</span>
          <div className="admin-stat-label">Total videos</div>
          <div className="admin-stat-value">{Number(stats?.totalVideos || 0).toLocaleString()}</div>
          <div className="admin-stat-note">Created on the platform</div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon violet" aria-hidden="true">◉</span>
          <div className="admin-stat-label">Video views</div>
          <div className="admin-stat-value">{Number(stats?.totalViews || 0).toLocaleString()}</div>
          <div className="admin-stat-note">Views across all videos</div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon amber" aria-hidden="true">↗</span>
          <div className="admin-stat-label">Awaiting review</div>
          <div className="admin-stat-value">{Number(stats?.pendingWithdrawals || 0).toLocaleString()}</div>
          <div className="admin-stat-note">Pending withdrawal requests</div>
        </article>
      </section>

      <section className="admin-management-section">
        <div className="admin-section-heading">
          <div>
            <h2>Management</h2>
            <p>Go directly to a platform workspace.</p>
          </div>
        </div>
        <div className="admin-management-grid">
          {managementLinks.map((item) => (
            <Link className="admin-management-card" to={item.to} key={item.to}>
              <span className="admin-management-icon" aria-hidden="true">{item.icon}</span>
              <span className="admin-management-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="admin-management-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="admin-data-grid">
        <section className="admin-data-card">
          <div className="admin-section-heading admin-data-heading">
            <div>
              <h2>Recent members</h2>
              <p>Latest accounts to join the platform.</p>
            </div>
            <Link className="admin-text-link" to="/admin/users">All users <span aria-hidden="true">→</span></Link>
          </div>
          <label className="admin-search">
            <span className="admin-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search recent members"
              aria-label="Search recent members"
            />
          </label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Member</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td className="admin-empty-row" colSpan={3}>{userSearch ? 'No matching members.' : 'No members to show yet.'}</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-member">
                        <span className="admin-member-avatar" aria-hidden="true">
                          {(user.firstName || user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{[user.firstName || user.first_name, user.lastName || user.last_name].filter(Boolean).join(' ') || 'Member'}</strong>
                          <small>{user.email || '—'}</small>
                        </span>
                      </div>
                    </td>
                    <td><span className={`admin-role-badge ${user.role === 'admin' ? 'is-admin' : ''}`}>{user.role || 'user'}</span></td>
                    <td className="admin-date-cell">{formatDate(user.createdAt || user.created_at || user.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-data-card">
          <div className="admin-section-heading admin-data-heading">
            <div>
              <h2>Withdrawal activity</h2>
              <p>Recent payout requests from members.</p>
            </div>
            <Link className="admin-text-link" to="/admin/withdrawals">Review all <span aria-hidden="true">→</span></Link>
          </div>
          <label className="admin-filter">
            <span className="admin-filter-label">Status</span>
            <select value={withdrawalFilter} onChange={(event) => setWithdrawalFilter(event.target.value)}>
              <option value="all">All requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Member</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr><td className="admin-empty-row" colSpan={3}>{withdrawalFilter === 'all' ? 'No withdrawal activity to show yet.' : `No ${withdrawalFilter} requests in the latest activity.`}</td></tr>
                ) : filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td>
                      <div className="admin-withdrawal-member">
                        <strong>{[withdrawal.first_name || withdrawal.firstName, withdrawal.last_name || withdrawal.lastName].filter(Boolean).join(' ') || 'Member'}</strong>
                        <small>{withdrawal.payment_method || withdrawal.paymentMethod || 'Mobile money'}</small>
                      </div>
                    </td>
                    <td className="admin-amount-cell">{formatCurrency(withdrawal.amount)}</td>
                    <td><span className={`admin-status-badge ${String(withdrawal.status || 'pending').toLowerCase()}`}>{withdrawal.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="admin-payout-summary">
        <div className="admin-payout-symbol" aria-hidden="true">RWF</div>
        <div>
          <strong>Total paid out</strong>
          <p>Completed withdrawals recorded on the platform.</p>
        </div>
        <span className="admin-payout-value">{formatCurrency(stats?.totalWithdrawn)}</span>
      </section>
    </div>
  )
}

export default AdminDashboard
