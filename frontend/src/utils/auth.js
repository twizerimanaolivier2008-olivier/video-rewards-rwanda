import api from './api'

const getStoredValue = (key) => localStorage.getItem(key) || sessionStorage.getItem(key)

const notifyAuthChange = () => window.dispatchEvent(new Event('auth-change'))

export const syncCurrentUser = (user) => {
  const storage = localStorage.getItem('token') ? localStorage : sessionStorage
  storage.setItem('user', JSON.stringify(user))
  notifyAuthChange()
  return user
}

const storeSession = (token, user, rememberMe = true) => {
  const storage = rememberMe ? localStorage : sessionStorage
  const otherStorage = rememberMe ? sessionStorage : localStorage
  otherStorage.removeItem('token')
  otherStorage.removeItem('user')
  storage.setItem('token', token)
  storage.setItem('user', JSON.stringify(user))
  notifyAuthChange()
}

export const login = async (email, password, rememberMe = true) => {
  const response = await api.post('/auth/login', { email, password })
  const { token, user } = response.data
  storeSession(token, user, rememberMe)
  return user
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  const { token, user } = response.data
  storeSession(token, user)
  return user
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  notifyAuthChange()
}

export const getCurrentUser = () => {
  const user = getStoredValue('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return !!getStoredValue('token')
}

export const isAdmin = () => {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data)
  const user = response.data.user || response.data
  return syncCurrentUser(user)
}
