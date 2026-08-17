// Water Lily Handicrafts - Products API Store
// Vue 3 Composition API store for fetching products from backend

import { ref } from 'vue'
import { useAuth } from './useAuth.js'

const API_URL = 'http://localhost:5000/api'

// Products state (cached)
const products = ref([])
const categories = ref([])
const isLoading = ref(false)
const error = ref(null)

// Fetch all products
const fetchProducts = async (filters = {}) => {
  isLoading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.search) params.append('search', filters.search)
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.limit) params.append('limit', filters.limit)
    
    const queryString = params.toString()
    const url = `${API_URL}/products${queryString ? '?' + queryString : ''}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products')
    }
    
    products.value = data
    return data
  } catch (err) {
    error.value = err.message
    console.error('Error fetching products:', err)
    return []
  } finally {
    isLoading.value = false
  }
}

// Fetch single product by ID
const fetchProductById = async (id) => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${API_URL}/products/${id}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch product')
    }
    
    return data
  } catch (err) {
    error.value = err.message
    console.error('Error fetching product:', err)
    return null
  } finally {
    isLoading.value = false
  }
}

// Fetch categories
const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/products/categories`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch categories')
    }
    
    categories.value = data
    return data
  } catch (err) {
    console.error('Error fetching categories:', err)
    return []
  }
}

// Create product (admin only)
const createProduct = async (productData) => {
  const { authFetch } = useAuth()
  isLoading.value = true
  error.value = null
  
  try {
    const data = await authFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    })
    
    products.value.push(data)
    return { success: true, product: data }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    isLoading.value = false
  }
}

// Update product (admin only)
const updateProduct = async (id, productData) => {
  const { authFetch } = useAuth()
  isLoading.value = true
  error.value = null
  
  try {
    const data = await authFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    })
    
    // Update local cache
    const index = products.value.findIndex(p => p._id === id)
    if (index > -1) {
      products.value[index] = data
    }
    
    return { success: true, product: data }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    isLoading.value = false
  }
}

// Delete product (admin only)
const deleteProduct = async (id) => {
  const { authFetch } = useAuth()
  isLoading.value = true
  error.value = null
  
  try {
    await authFetch(`/products/${id}`, {
      method: 'DELETE'
    })
    
    // Remove from local cache
    products.value = products.value.filter(p => p._id !== id)
    
    return { success: true }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    isLoading.value = false
  }
}

// Export composable
export function useProducts() {
  return {
    // State
    products,
    categories,
    isLoading,
    error,
    
    // Actions
    fetchProducts,
    fetchProductById,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct
  }
}
