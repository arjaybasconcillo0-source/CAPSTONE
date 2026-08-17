// Water Lily Handicrafts - Authentication Store
// Vue 3 Composition API store for auth management with localStorage persistence

import { ref, computed } from 'vue'

const API_URL = 'http://localhost:5000/api'

// Auth state
const user = ref(null)
const token = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Load auth from localStorage on initialization
const loadAuthFromStorage = () => {
  try {
    const storedToken = localStorage.getItem('waterlily-token')
    const storedUser = localStorage.getItem('waterlily-user')
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  } catch (err) {
    console.error('Error loading auth from localStorage:', err)
    clearAuth()
  }
}

// Save auth to localStorage
const saveAuthToStorage = () => {
  try {
    if (token.value && user.value) {
      localStorage.setItem('waterlily-token', token.value)
      localStorage.setItem('waterlily-user', JSON.stringify(user.value))
    }
  } catch (err) {
    console.error('Error saving auth to localStorage:', err)
  }
}

// Clear auth from localStorage
const clearAuth = () => {
  localStorage.removeItem('waterlily-token')
  localStorage.removeItem('waterlily-user')
  token.value = null
  user.value = null
}

// Initialize auth from localStorage
loadAuthFromStorage()

// Computed properties
const isAuthenticated = computed(() => !!token.value && !!user.value)
const isAdmin = computed(() => user.value?.role === 'admin')
const userName = computed(() => user.value?.name || '')

// API helper with auth header
const authFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  
  return data
}

// Auth actions
const login = async (email, password) => {
  isLoading.value = true
  error.value = null
  
  try {
    const data = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    token.value = data.token
    user.value = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role
    }
    
    saveAuthToStorage()
    return { success: true }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    isLoading.value = false
  }
}

const register = async (name, email, password) => {
  isLoading.value = true
  error.value = null
  
  try {
    const data = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    })
    
    token.value = data.token
    user.value = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role
    }
    
    saveAuthToStorage()
    return { success: true }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    isLoading.value = false
  }
}

const logout = () => {
  clearAuth()
}

const getProfile = async () => {
  if (!token.value) return null
  
  try {
    const data = await authFetch('/auth/profile')
    user.value = data
    saveAuthToStorage()
    return data
  } catch (err) {
    console.error('Error getting profile:', err)
    if (err.message.includes('Not authorized')) {
      clearAuth()
    }
    return null
  }
}

// Export composable
export function useAuth() {
  return {
    // State
    user,
    token,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    isAdmin,
    userName,
    
    // Actions
    login,
    register,
    logout,
    getProfile,
    authFetch
  }
}
