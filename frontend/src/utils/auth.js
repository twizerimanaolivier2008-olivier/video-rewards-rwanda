import api from './api'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const { token, user } = response.data
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  const { token, user } = response.data
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const isAdmin = () => {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data)
  const user = response.data.user
  localStorage.setItem('user', JSON.stringify(user))
  return user
}
