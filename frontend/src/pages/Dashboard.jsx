import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, transactionsRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/users/transactions'),
        ])
        setStats(statsRes.data)
        setTransactions(transactionsRes.data.transactions || transactionsRes.data)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) {
      fetchDashboard()
    }
  }, [isAuthenticated])

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess('')

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawError('Please enter a valid amount')
      return
    }

    if (!withdrawPhone.trim()) {
      setWithdrawError('Phone number is required')
      return
    }

    setWithdrawLoading(true)

    try {
      await api.post('/payments/withdrawals', {
        amount: parseFloat(withdrawAmount),
        phoneNumber: withdrawPhone,
      })
      setWithdrawSuccess('Withdrawal request submitted successfully!')
      setWithdrawAmount('')
      setWithdrawPhone('')
      setShowWithdrawModal(false)
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Withdrawal failed')
    } finally {
      setWithdrawLoading(false)
    }
  }

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
      marginBottom: '0.5rem',
      color: '#1a1a1a',
    },
    welcomeText: {
      color: '#6b7280',
      marginBottom: '2rem',
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
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    withdrawButton: {
      padding: '10px 24px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
      transition: 'background-color 0.2s',
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      backgroundColor: '#f9fafb',
      fontWeight: '600',
      fontSize: '0.85rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.9rem',
      color: '#374151',
    },
    statusBadge: (status) => ({
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      backgroundColor:
        status === 'completed'
          ? '#f0fdf4'
          : status === 'pending'
          ? '#fef3c7'
          : '#fef2f2',
      color:
        status === 'completed'
          ? '#15803d'
          : status === 'pending'
          ? '#92400e'
          : '#dc2626',
    }),
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '440px',
      width: '90%',
      boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: '#1a1a1a',
    },
    modalFormGroup: {
      marginBottom: '1rem',
    },
    modalLabel: {
      display: 'block',
      marginBottom: '0.375rem',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#374151',
    },
    modalInput: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
    },
    modalActions: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    modalCancelButton: {
      flex: 1,
      padding: '10px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
    },
    modalSubmitButton: {
      flex: 1,
      padding: '10px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
    },
    modalError: {
      color: '#dc2626',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    modalSuccess: {
      color: '#15803d',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#6b7280' }}>Please log in to view your dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.welcomeText}>Welcome back, {user?.first_name || 'User'}!</p>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Points Balance</div>
          <div style={{ ...styles.statValue, ...styles.statValueGreen }}>
            {stats?.pointsBalance ?? 0}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Account Balance</div>
          <div style={{ ...styles.statValue, ...styles.statValueGreen }}>
            {formatCurrency(stats?.accountBalance ?? 0)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Earned</div>
          <div style={{ ...styles.statValue, ...styles.statValueGreen }}>
            {formatCurrency(stats?.totalEarned ?? 0)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Withdrawn</div>
          <div style={styles.statValue}>{formatCurrency(stats?.totalWithdrawn ?? 0)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={styles.sectionTitle}>Recent Transactions</h2>
        <button onClick={() => setShowWithdrawModal(true)} style={styles.withdrawButton}>
          Withdraw
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Points</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id || tx.id}>
                  <td style={styles.td}>
                    {new Date(tx.createdAt || tx.date).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>{tx.type || 'N/A'}</td>
                  <td style={styles.td}>{tx.description || '—'}</td>
                  <td style={styles.td}>{tx.points ?? 0}</td>
                  <td style={styles.td}>{formatCurrency(tx.amount ?? 0)}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(tx.status || 'pending')}>
                      {tx.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showWithdrawModal && (
        <div style={styles.modalOverlay} onClick={() => setShowWithdrawModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Request Withdrawal</h3>

            {withdrawError && <p style={styles.modalError}>{withdrawError}</p>}
            {withdrawSuccess && <p style={styles.modalSuccess}>{withdrawSuccess}</p>}

            <form onSubmit={handleWithdraw}>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Amount (RWF)</label>
                <input
                  type="number"
                  min="1000"
                  step="100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={styles.modalInput}
                  placeholder="Minimum 1,000 RWF"
                  required
                />
              </div>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Phone Number</label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  style={styles.modalInput}
                  placeholder="+250 788 123 456"
                  required
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  style={styles.modalCancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  style={{
                    ...styles.modalSubmitButton,
                    ...(withdrawLoading ? { opacity: 0.6 } : {}),
                  }}
                >
                  {withdrawLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard