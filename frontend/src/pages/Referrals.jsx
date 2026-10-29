import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useReferrals } from '../hooks/useReferrals'
import api from '../utils/api'

const Referrals = () => {
  const { user } = useAuth()
  const { referrals, stats, loading, fetchReferrals, getReferralStats } = useReferrals()
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const init = async () => {
      await getReferralStats()
      const codeRes = await api.get('/referrals/code')
      setReferralCode(codeRes.data.code || '')
      setReferralLink(`${window.location.origin}/register?ref=${codeRes.data.code || ''}`)
    }
    init()
  }, [getReferralStats])

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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
    referralCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    referralCodeSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    codeDisplay: {
      fontSize: '1.5rem',
      fontWeight: '700',
      backgroundColor: '#f0fdf4',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      color: '#15803d',
      letterSpacing: '0.05em',
    },
    copyButton: {
      padding: '8px 16px',
      backgroundColor: '#15803d',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    copiedBadge: {
      padding: '8px 16px',
      backgroundColor: '#dcfce7',
      color: '#15803d',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.9rem',
    },
    linkDisplay: {
      marginTop: '1rem',
      padding: '0.75rem 1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      wordBreak: 'break-all',
      fontSize: '0.9rem',
      color: '#374151',
    },
    linkButton: {
      padding: '6px 14px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.85rem',
      marginLeft: '0.5rem',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    statCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1a1a1a',
    },
    earningsBreakdown: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    breakdownTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    breakdownRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      borderBottom: '1px solid #f3f4f6',
    },
    breakdownLabel: {
      color: '#6b7280',
    },
    breakdownValue: {
      fontWeight: '600',
      color: '#1a1a1a',
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
    loading: {
      textAlign: 'center',
      padding: '4rem 1rem',
      color: '#6b7280',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading referral data...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Referral Program</h1>

      <div style={styles.referralCard}>
        <h2 style={{ ...styles.breakdownTitle, marginBottom: '1rem' }}>Your Referral Code</h2>
        <div style={styles.referralCodeSection}>
          <span style={styles.codeDisplay}>{referralCode || '—'}</span>
          <button onClick={() => copyToClipboard(referralCode)} style={styles.copyButton}>
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>
        <div style={styles.linkDisplay}>
          <span>{referralLink}</span>
          <button onClick={() => copyToClipboard(referralLink)} style={styles.linkButton}>
            Copy Link
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Referrals</div>
          <div style={styles.statValue}>{stats?.totalReferrals ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Level 1 Referrals</div>
          <div style={styles.statValue}>{stats?.level1Count ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Level 2 Referrals</div>
          <div style={styles.statValue}>{stats?.level2Count ?? 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Referral Earnings</div>
          <div style={{ ...styles.statValue, color: '#15803d' }}>
            {formatCurrency(stats?.totalReferralEarnings ?? 0)}
          </div>
        </div>
      </div>

      <div style={styles.earningsBreakdown}>
        <h3 style={styles.breakdownTitle}>Earnings Breakdown</h3>
        <div style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>Level 1 Referral Bonus</span>
          <span style={styles.breakdownValue}>{formatCurrency(stats?.level1Earnings ?? 0)}</span>
        </div>
        <div style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>Level 2 Referral Bonus</span>
          <span style={styles.breakdownValue}>{formatCurrency(stats?.level2Earnings ?? 0)}</span>
        </div>
        <div style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>Total Referral Earnings</span>
          <span style={{ ...styles.breakdownValue, color: '#15803d' }}>
            {formatCurrency(stats?.totalReferralEarnings ?? 0)}
          </span>
        </div>
      </div>

      <h2 style={styles.breakdownTitle}>Referred Users</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Registered</th>
              <th style={styles.th}>Level</th>
              <th style={styles.th}>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No referrals yet. Share your referral code to start earning!
                </td>
              </tr>
            ) : (
              referrals.map((ref) => (
                <tr key={ref._id || ref.id}>
                  <td style={styles.td}>{ref.name || '—'}</td>
                  <td style={styles.td}>{ref.email || '—'}</td>
                  <td style={styles.td}>{ref.phone || '—'}</td>
                  <td style={styles.td}>
                    {new Date(ref.createdAt || ref.registeredAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>Level {ref.level ?? 1}</td>
                  <td style={styles.td}>{formatCurrency(ref.earnings ?? 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Referrals