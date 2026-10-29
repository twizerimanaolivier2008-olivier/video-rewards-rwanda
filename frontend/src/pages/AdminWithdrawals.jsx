import { useState, useEffect } from 'react'
import api from '../utils/api'

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/withdrawals')
      setWithdrawals(response.data.withdrawals || response.data)
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/admin/withdrawals/${id}`, { status: newStatus })
      fetchWithdrawals()
    } catch (err) {
      console.error('Failed to update withdrawal:', err)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (statusFilter === 'all') return true
    return w.status === statusFilter
  })

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: '#1a1a1a',
    },
    filterRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      alignItems: 'center',
    },
    filterLabel: {
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#374151',
    },
    select: {
      padding: '8px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.95rem',
      backgroundColor: '#ffffff',
      outline: 'none',
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
    statusBadge: (status) => ({
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      backgroundColor:
        status === 'approved'
          ? '#f0fdf4'
          : status === 'pending'
          ? '#fef3c7'
          : status === 'rejected'
          ? '#fef2f2'
          : '#f3f4f6',
      color:
        status === 'approved'
          ? '#15803d'
          : status === 'pending'
          ? '#92400e'
          : status === 'rejected'
          ? '#dc2626'
          : '#6b7280',
    }),
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    approveButton: {
      padding: '4px 12px',
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
    },
    rejectButton: {
      padding: '4px 12px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
    },
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
    summaryRow: {
      display: 'flex',
      gap: '1.5rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    },
    summaryCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#6b7280',
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#1a1a1a',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading withdrawals...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Withdrawals</h1>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Requests</div>
          <div style={styles.summaryValue}>{withdrawals.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Pending</div>
          <div style={{ ...styles.summaryValue, color: '#d97706' }}>
            {withdrawals.filter((w) => w.status === 'pending').length}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Approved</div>
          <div style={{ ...styles.summaryValue, color: '#15803d' }}>
            {withdrawals.filter((w) => w.status === 'approved').length}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Rejected</div>
          <div style={{ ...styles.summaryValue, color: '#dc2626' }}>
            {withdrawals.filter((w) => w.status === 'rejected').length}
          </div>
        </div>
      </div>

      <div style={styles.filterRow}>
        <span style={styles.filterLabel}>Filter by status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

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
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No withdrawals found
                </td>
              </tr>
            ) : (
              filteredWithdrawals.map((w) => (
                <tr key={w._id || w.id}>
                   <td style={styles.td}>{w.user?.first_name ? `${w.user.first_name} ${w.user.last_name}` : '—'}</td>
                  <td style={styles.td}>{formatCurrency(w.amount)}</td>
                  <td style={styles.td}>{w.paymentMethod || '—'}</td>
                  <td style={styles.td}>{w.phoneNumber || '—'}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(w.status || 'pending')}>
                      {w.status || 'pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(w.createdAt || w.date).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    {w.status === 'pending' && (
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleStatusChange(w._id || w.id, 'approved')}
                          style={styles.approveButton}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(w._id || w.id, 'rejected')}
                          style={styles.rejectButton}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminWithdrawals