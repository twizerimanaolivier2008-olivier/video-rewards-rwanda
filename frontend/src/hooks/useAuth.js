import { useState, useEffect } from 'react'
import { login, register, logout, getCurrentUser, isAuthenticated, isAdmin, updateProfile } from '../utils/auth'

export const useAuth = () => {
  const [user, setUser] = useState(getCurrentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      setUser(getCurrentUser())
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLogin = async (email, password) => {
    const user = await login(email, password)
    setUser(user)
    return user
  }

  const handleRegister = async (userData) => {
    const user = await register(userData)
    setUser(user)
    return user
  }

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  const handleUpdateProfile = async (data) => {
    const user = await updateProfile(data)
    setUser(user)
    return user
  }

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile
  }
}
