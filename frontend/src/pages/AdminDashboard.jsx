import { useState, useEffect } from 'react'
import api from '../utils/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentWithdrawals, setRecentWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, withdrawalsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=10'),
          api.get('/admin/withdrawals?limit=10'),
        ])
        setStats(statsRes.data)
        setRecentUsers(usersRes.data.users || usersRes.data)
        setRecentWithdrawals(withdrawalsRes.data.withdrawals || withdrawalsRes.data)
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '2rem',
      color: '#1a1a1a',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    statCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    statValue: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#1a1a1a',
    },
    statValueGreen: {
      color: '#15803d',
    },
    statValueYellow: {
      color: '#d97706',
    },
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    chartPlaceholder: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '2rem',
      textAlign: 'center',
      color: '#9ca3af',
      marginBottom: '1rem',
      minHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    barChart: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '0.5rem',
      height: '150px',
      padding: '0 1rem',
    },
    bar: {
      flex: 1,
      backgroundColor: '#15803d',
      borderRadius: '4px 4px 0 0',
      minWidth: '30px',
      transition: 'height 0.3s ease',
    },
    barLabel: {
      textAlign: 'center',
      fontSize: '0.7rem',
      color: '#6b7280',
      marginTop: '0.5rem',
    },
    chartContainer: {
      marginBottom: '1rem',
    },
    tableContainer: {
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '10px 12px',
      backgroundColor: '#f9fafb',
      fontWeight: '600',
      fontSize: '0.8rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb',
    },
    td: {
      padding: '10px 12px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.85rem',
      color: '#374151',
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
    },
    manageCard: {
      flex: '1',
      minWidth: '150px',
      padding: '1rem 1.25rem',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '0.95rem',
      color: '#1a1a1a',
      textDecoration: 'none',
      textAlign: 'center',
      transition: 'background-color 0.2s, border-color 0.2s',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading admin dashboard...</div>
      </div>
    )
  }

  const chartData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 62 },
    { label: 'Wed', value: 38 },
    { label: 'Thu', value: 71 },
    { label: 'Fri', value: 55 },
    { label: 'Sat', value: 80 },
    { label: 'Sun', value: 42 },
  ]
  const maxVal = Math.max(...chartData.map((d) => d.value))

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>

<div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Users</div>
          <div style={styles.statValue}>{stats?.totalUsers ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Videos</div>
          <div style={styles.statValue}>{stats?.totalVideos ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Views</div>
          <div style={styles.statValue}>{stats?.totalViews ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Pending Withdrawals</div>
          <div style={{ ...styles.statValue, ...styles.statValueYellow }}>
            {stats?.pendingWithdrawals ?? 0}
          </div>
        </div>
      </div>

      <div style={{ ...styles.section, display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ ...styles.sectionTitle, width: '100%' }}>Management Tools</h3>
        <a href="/admin/users" style={styles.manageCard}>👥 Manage Users</a>
        <a href="/admin/videos" style={styles.manageCard}>🎥 Manage Videos</a>
        <a href="/admin/companies" style={styles.manageCard}>🏢 Manage Companies</a>
        <a href="/admin/withdrawals" style={styles.manageCard}>💳 Manage Withdrawals</a>
      </div>

      <div style={styles.grid2}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Weekly Views</h3>
          <div style={styles.chartContainer}>
            <div style={styles.barChart}>
              {chartData.map((d) => (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${(d.value / maxVal) * 100}%`,
                    }}
                  />
                  <span style={styles.barLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>User Registrations</h3>
          <div style={styles.chartPlaceholder}>
            <p>Chart visualization would go here</p>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Users</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u._id || u.id}>
                     <td style={styles.td}>{u.firstName ? `${u.firstName} ${u.lastName}` : '—'}</td>
                     <td style={styles.td}>{u.email || '—'}</td>
                     <td style={styles.td}>{u.phoneNumber || '—'}</td>
                     <td style={styles.td}>{u.role || 'user'}</td>
                     <td style={styles.td}>
                       {new Date(u.createdAt || u.joinedAt).toLocaleDateString()}
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Withdrawals</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Method</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                recentWithdrawals.map((w) => (
                  <tr key={w._id || w.id}>
                     <td style={styles.td}>{w.user?.first_name ? `${w.user.first_name} ${w.user.last_name}` : '—'}</td>
                    <td style={styles.td}>{formatCurrency(w.amount)}</td>
                    <td style={styles.td}>{w.paymentMethod || '—'}</td>
                    <td style={styles.td}>{w.phoneNumber || '—'}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor:
                            w.status === 'approved'
                              ? '#f0fdf4'
                              : w.status === 'pending'
                              ? '#fef3c7'
                              : '#fef2f2',
                          color:
                            w.status === 'approved'
                              ? '#15803d'
                              : w.status === 'pending'
                              ? '#92400e'
                              : '#dc2626',
                        }}
                      >
                        {w.status || 'pending'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(w.createdAt || w.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard