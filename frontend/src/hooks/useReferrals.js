import { useState, useEffect } from 'react'
import api from '../utils/api'

export const useReferrals = () => {
  const [referrals, setReferrals] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchReferrals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/referrals')
      setReferrals(response.data.referrals || response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getReferralStats = async () => {
    const response = await api.get('/referrals/stats')
    setStats(response.data)
    return response.data
  }

  const generateReferralCode = async () => {
    const response = await api.post('/referrals/generate')
    return response.data
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  return {
    referrals,
    stats,
    loading,
    error,
    fetchReferrals,
    getReferralStats,
    generateReferralCode
  }
}
