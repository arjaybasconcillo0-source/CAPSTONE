// Water Lily Handicrafts - Cart Store
// Vue 3 Composition API store for cart management with localStorage persistence

import { ref, computed, watch } from 'vue'
import { getProductById } from '../data/products.js'

// Cart state
const cartItems = ref([])
const isCartOpen = ref(false)

// Load cart from localStorage on initialization
const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem('waterlily-cart')
    if (stored) {
      cartItems.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    cartItems.value = []
  }
}

// Save cart to localStorage
const saveCartToStorage = () => {
  try {
    localStorage.setItem('waterlily-cart', JSON.stringify(cartItems.value))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

// Watch for cart changes and save to localStorage
watch(cartItems, saveCartToStorage, { deep: true })

// Initialize cart from localStorage
loadCartFromStorage()

// Cart computed properties
const cartCount = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

const cartSubtotal = computed(() => {
  return cartItems.value.reduce((total, item) => {
    const product = getProductById(item.productId)
    return total + (product ? product.price * item.quantity : 0)
  }, 0)
})

const cartTotal = computed(() => {
  const subtotal = cartSubtotal.value
  const shipping = subtotal > 3000 ? 0 : 150 // Free shipping over ₱3000
  return subtotal + shipping
})

const shippingFee = computed(() => {
  return cartSubtotal.value > 3000 ? 0 : 150
})

// Cart actions
const addToCart = (productId, variantSize = null, variantColor = null, quantity = 1) => {
  const product = getProductById(productId)
  if (!product) {
    console.error('Product not found:', productId)
    return false
  }

  // Create a unique key for the cart item based on product + variant
  const cartKey = `${productId}-${variantSize || 'default'}-${variantColor || 'default'}`
  
  const existingItem = cartItems.value.find(item => 
    item.productId === productId && 
    item.variantSize === variantSize && 
    item.variantColor === variantColor
  )

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cartItems.value.push({
      id: cartKey,
      productId,
      variantSize,
      variantColor,
      quantity,
      addedAt: new Date().toISOString()
    })
  }

  return true
}

const removeFromCart = (itemId) => {
  const index = cartItems.value.findIndex(item => item.id === itemId)
  if (index > -1) {
    cartItems.value.splice(index, 1)
    return true
  }
  return false
}

const updateItemQuantity = (itemId, quantity) => {
  const item = cartItems.value.find(item => item.id === itemId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      item.quantity = quantity
    }
    return true
  }
  return false
}

const clearCart = () => {
  cartItems.value = []
}

const toggleCart = () => {
  isCartOpen.value = !isCartOpen.value
}

const openCart = () => {
  isCartOpen.value = true
}

const closeCart = () => {
  isCartOpen.value = false
}

// Get cart items with product details
const cartItemsWithDetails = computed(() => {
  return cartItems.value.map(item => {
    const product = getProductById(item.productId)
    if (!product) return null

    // Find the specific variant details
    const variant = product.variants.find(v => 
      v.size === item.variantSize && v.color === item.variantColor
    )

    return {
      ...item,
      product,
      variant,
      subtotal: product.price * item.quantity
    }
  }).filter(Boolean) // Remove null entries
})

// Format currency (Philippine Peso)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Export the cart composable
export function useCart() {
  return {
    // State
    cartItems: cartItems.value,
    isCartOpen,
    
    // Computed
    cartCount,
    cartSubtotal,
    cartTotal,
    shippingFee,
    cartItemsWithDetails,
    
    // Actions
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    
    // Utils
    formatCurrency
  }
}

// For direct access in components
export {
  cartItems,
  cartCount,
  cartSubtotal,
  cartTotal,
  shippingFee,
  cartItemsWithDetails,
  addToCart,
  removeFromCart,
  updateItemQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  formatCurrency
}