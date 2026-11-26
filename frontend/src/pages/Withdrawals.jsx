import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

const Withdrawals = () => {
  const { user, isAuthenticated } = useAuth()
  const [balance, setBalance] = useState(0)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, withdrawalsRes] = await Promise.all([
          api.get('/users/balance'),
          api.get('/payments/withdrawals'),
        ])
        setBalance(balanceRes.data.balance ?? balanceRes.data.accountBalance ?? 0)
        setWithdrawals(withdrawalsRes.data.withdrawals || withdrawalsRes.data)
      } catch (err) {
        console.error('Failed to fetch withdrawal data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid amount')
      return
    }

    if (!phoneNumber.trim()) {
      setSubmitError('Phone number is required')
      return
    }

    setSubmitting(true)

    try {
      const requestKey = idempotencyKey || window.crypto.randomUUID()
      if (!idempotencyKey) setIdempotencyKey(requestKey)
      await api.post('/payments/withdrawals', {
        amount,
        phone_number: phoneNumber,
        payment_method: paymentMethod,
      }, {
        headers: { 'Idempotency-Key': requestKey },
      })
      setSubmitSuccess('Withdrawal request submitted. Your funds are reserved while the request is reviewed.')
      setAmount('')
      setPhoneNumber('')
      setPaymentMethod('mtn_momo')
      setIdempotencyKey('')

      const res = await api.get('/payments/withdrawals')
      setWithdrawals(res.data.withdrawals || res.data)
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Withdrawal request failed')
    } finally {
      setSubmitting(false)
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
      marginBottom: '2rem',
      color: '#1a1a1a',
    },
    balanceCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem',
      alignItems: 'center',
    },
    balanceItem: {
      textAlign: 'center',
    },
    balanceLabel: {
      fontSize: '0.85rem',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '0.25rem',
    },
    balanceValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#15803d',
    },
    notice: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '10px 14px',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontSize: '0.9rem',
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem',
    },
    formTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.375rem',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      backgroundColor: '#ffffff',
      outline: 'none',
    },
    submitButton: {
      padding: '12px 24px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '700',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'background-color 0.2s',
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    errorText: {
      color: '#dc2626',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
    },
    successText: {
      color: '#15803d',
      fontSize: '0.85rem',
      marginBottom: '0.5rem',
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
          : status === 'failed'
          ? '#fef2f2'
          : '#f3f4f6',
      color:
        status === 'completed'
          ? '#15803d'
          : status === 'pending'
          ? '#92400e'
          : status === 'rejected'
          ? '#dc2626'
          : '#6b7280',
    }),
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
    },
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#6b7280' }}>Please log in to view withdrawals.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading withdrawal data...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Withdrawals</h1>

      <div style={styles.balanceCard}>
        <div style={styles.balanceItem}>
          <div style={styles.balanceLabel}>Current Balance</div>
          <div style={styles.balanceValue}>{formatCurrency(balance)}</div>
        </div>
        <div style={styles.balanceItem}>
          <div style={styles.balanceLabel}>Minimum Withdrawal</div>
          <div style={styles.balanceValue}>2,000 RWF</div>
        </div>
        <div style={styles.balanceItem}>
          <div style={styles.balanceLabel}>Total Withdrawn</div>
          <div style={styles.balanceValue}>
            {formatCurrency(
              withdrawals
                .filter((w) => w.status === 'completed')
                .reduce((sum, w) => sum + (w.amount || 0), 0)
            )}
          </div>
        </div>
      </div>

      <div style={styles.notice}>
        Minimum withdrawal amount is 2,000 RWF. Funds are reserved while your request is reviewed.
      </div>

      <div style={styles.formCard}>
        <h3 style={styles.formTitle}>Request Withdrawal</h3>

        {submitError && <p style={styles.errorText}>{submitError}</p>}
        {submitSuccess && <p style={styles.successText}>{submitSuccess}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (RWF)</label>
            <input
              type="number"
              min="2000"
              step="100"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setIdempotencyKey('') }}
              style={styles.input}
              placeholder="Minimum 2,000 RWF"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setIdempotencyKey('') }}
              style={styles.input}
              placeholder="+250 788 123 456"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setIdempotencyKey('') }}
              style={styles.select}
            >
              <option value="mtn_momo">MTN Mobile Money</option>
              <option value="airtel_money">Airtel Money</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitButton,
              ...(submitting ? styles.submitButtonDisabled : {}),
            }}
          >
            {submitting ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      <h2 style={{ ...styles.formTitle, marginBottom: '1rem' }}>Withdrawal History</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Method</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No withdrawal requests yet
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w._id || w.id}>
                  <td style={styles.td}>
                    {new Date(w.createdAt || w.date).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>{formatCurrency(w.amount)}</td>
                  <td style={styles.td}>{w.paymentMethod || '—'}</td>
                  <td style={styles.td}>{w.phoneNumber || '—'}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(w.status || 'pending')}>
                      {w.status || 'pending'}
                    </span>
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

export default Withdrawals