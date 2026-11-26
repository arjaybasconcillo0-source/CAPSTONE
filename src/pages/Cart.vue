<template>
  <div class="cart-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Shopping Cart</h1>
        <p v-if="cartCount > 0" class="page-description">
          {{ cartCount }} {{ cartCount === 1 ? 'item' : 'items' }} in your cart
        </p>
      </div>

      <!-- Empty Cart -->
      <div v-if="cartCount === 0" class="empty-cart">
        <div class="empty-cart-content">
          <div class="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any handcrafted treasures yet.</p>
          <router-link to="/shop" class="btn btn-primary btn-lg">
            Start Shopping
            <ShopIcon />
          </router-link>
        </div>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-content">
        <!-- Cart Items -->
        <div class="cart-items">
          <div class="cart-items-header">
            <h2>Cart Items</h2>
            <button 
              @click="clearAllItems"
              class="clear-all-btn"
              :disabled="isUpdating"
            >
              Clear All
            </button>
          </div>

          <div class="cart-items-list">
            <CartItem
              v-for="item in cartItemsWithDetails"
              :key="item.id"
              :item="item"
              @update-quantity="updateQuantity"
              @remove="removeItem"
              :disabled="isUpdating"
            />
          </div>

          <!-- Continue Shopping -->
          <div class="continue-shopping">
            <router-link to="/shop" class="btn btn-ghost">
              <ArrowLeftIcon />
              Continue Shopping
            </router-link>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <div class="summary-card">
            <h2 class="summary-title">Order Summary</h2>
            
            <div class="summary-details">
              <div class="summary-line">
                <span>Subtotal ({{ cartCount }} items)</span>
                <span class="summary-amount">{{ formatCurrency(cartSubtotal) }}</span>
              </div>
              
              <div class="summary-line">
                <span class="shipping-label">
                  Shipping
                  <span v-if="shippingFee === 0" class="free-shipping-note">
                    (Free shipping over ₱3,000!)
                  </span>
                </span>
                <span class="summary-amount">
                  {{ shippingFee === 0 ? 'Free' : formatCurrency(shippingFee) }}
                </span>
              </div>
              
              <div v-if="shippingFee > 0" class="free-shipping-progress">
                <div class="progress-text">
                  Add {{ formatCurrency(3000 - cartSubtotal) }} more for free shipping
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: Math.min((cartSubtotal / 3000) * 100, 100) + '%' }"
                  ></div>
                </div>
              </div>
              
              <div class="summary-line summary-total">
                <span>Total</span>
                <span class="summary-amount">{{ formatCurrency(cartTotal) }}</span>
              </div>
            </div>

            <!-- Promo Code -->
            <div class="promo-code-section">
              <div class="promo-input-group">
                <input
                  v-model="promoCode"
                  type="text"
                  placeholder="Enter promo code"
                  class="promo-input"
                  :disabled="isApplyingPromo"
                >
                <button 
                  @click="applyPromoCode"
                  class="btn btn-ghost btn-sm"
                  :disabled="!promoCode || isApplyingPromo"
                >
                  {{ isApplyingPromo ? 'Applying...' : 'Apply' }}
                </button>
              </div>
            </div>

            <!-- Checkout Button -->
            <router-link 
              :to="isAuthenticated
                ? { name: 'Checkout' }
                : { name: 'Login', query: { redirect: '/checkout' } }"
              class="checkout-btn btn btn-primary btn-lg"
            >
              Proceed to Checkout
              <ChevronRightIcon />
            </router-link>

            <!-- Security Badges -->
            <div class="security-badges">
              <div class="security-badge">
                <ShieldIcon />
                <span>Secure Checkout</span>
              </div>
              <div class="security-badge">
                <TruckIcon />
                <span>Fast Delivery</span>
              </div>
              <div class="security-badge">
                <RefreshIcon />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recently Viewed / Recommended Products -->
      <section v-if="cartCount > 0 && recommendedProducts.length > 0" class="recommended-products">
        <h2 class="section-title">You Might Also Like</h2>
        <ProductGrid 
          :products="recommendedProducts" 
          :columns="4"
        />
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCart } from '../composables/useCart.js'
import { useAuth } from '../composables/useAuth.js'
import { useProducts } from '../composables/useProducts.js'
import CartItem from '../components/CartItem.vue'
import ProductGrid from '../components/ProductGrid.vue'

// Icons
const ShopIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  `
}

const ArrowLeftIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12,19 5,12 12,5"/>
    </svg>
  `
}

const ChevronRightIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  `
}

const ShieldIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `
}

const TruckIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  `
}

const RefreshIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="23,4 23,10 17,10"/>
      <polyline points="1,20 1,14 7,14"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  `
}

export default {
  name: 'Cart',
  components: {
    CartItem,
    ProductGrid,
    ShopIcon,
    ArrowLeftIcon,
    ChevronRightIcon,
    ShieldIcon,
    TruckIcon,
    RefreshIcon
  },
  setup() {
    const { isAuthenticated } = useAuth()
    const { fetchProducts } = useProducts()
    const {
      cartItemsWithDetails,
      cartCount,
      cartSubtotal,
      cartTotal,
      shippingFee,
      updateItemQuantity,
      removeFromCart,
      clearCart,
      formatCurrency
    } = useCart()

    // Local state
    const isUpdating = ref(false)
    const promoCode = ref('')
    const isApplyingPromo = ref(false)
    const recommendedProducts = ref([])

    // Methods
    const updateQuantity = async (itemId, newQuantity) => {
      isUpdating.value = true
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateItemQuantity(itemId, newQuantity)
      } finally {
        isUpdating.value = false
      }
    }

    const removeItem = async (itemId) => {
      isUpdating.value = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        removeFromCart(itemId)
        
        if (window.showToast) {
          window.showToast('Item removed from cart', 'success')
        }
      } finally {
        isUpdating.value = false
      }
    }

    const clearAllItems = async () => {
      if (!confirm('Are you sure you want to clear all items from your cart?')) {
        return
      }
      
      isUpdating.value = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        clearCart()
        
        if (window.showToast) {
          window.showToast('Cart cleared', 'success')
        }
      } finally {
        isUpdating.value = false
      }
    }

    const applyPromoCode = async () => {
      if (!promoCode.value) return
      
      isApplyingPromo.value = true
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock promo code validation
        if (promoCode.value.toLowerCase() === 'welcome10') {
          if (window.showToast) {
            window.showToast('Promo code applied! 10% discount added.', 'success')
          }
        } else {
          if (window.showToast) {
            window.showToast('Invalid promo code. Please try again.', 'error')
          }
        }
        
        promoCode.value = ''
      } finally {
        isApplyingPromo.value = false
      }
    }

    // Load recommended products
    const loadRecommendedProducts = async () => {
      const availableProducts = await fetchProducts()
      const cartProductIds = new Set(
        cartItemsWithDetails.value.map(item => String(item.product._id))
      )
      recommendedProducts.value = availableProducts
        .filter(product => !cartProductIds.has(String(product._id)))
        .slice(0, 4)
        .map(product => ({ ...product, id: product._id || product.id }))
    }

    onMounted(() => {
      loadRecommendedProducts()
    })

    return {
      // Cart
      cartItemsWithDetails,
      cartCount,
      isAuthenticated,
      cartSubtotal,
      cartTotal,
      shippingFee,
      formatCurrency,
      
      // Local state
      isUpdating,
      promoCode,
      isApplyingPromo,
      recommendedProducts,
      
      // Methods
      updateQuantity,
      removeItem,
      clearAllItems,
      applyPromoCode
    }
  }
}
</script>

<style scoped>
.cart-page {
  padding: var(--space-6) 0 var(--space-8) 0;
  min-height: 80vh;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--green-700);
  margin-bottom: var(--space-2);
}

.page-description {
  color: var(--ink-light);
  font-size: var(--text-lg);
}

/* Empty Cart */
.empty-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.empty-cart-content {
  text-align: center;
  max-width: 500px;
}

.empty-cart-icon {
  font-size: 5rem;
  margin-bottom: var(--space-4);
}

.empty-cart-content h2 {
  font-size: var(--text-3xl);
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.empty-cart-content p {
  color: var(--ink-light);
  font-size: var(--text-lg);
  margin-bottom: var(--space-5);
}

/* Cart Content */
.cart-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-8);
  align-items: start;
}

/* Cart Items */
.cart-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--green-100);
}

.cart-items-header h2 {
  font-size: var(--text-2xl);
  color: var(--green-700);
}

.clear-all-btn {
  background: none;
  border: none;
  color: var(--ink-light);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.clear-all-btn:hover:not(:disabled) {
  color: var(--error);
  background: rgba(229, 62, 62, 0.1);
}

.clear-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.continue-shopping {
  padding-top: var(--space-4);
  border-top: 1px solid var(--green-100);
}

/* Order Summary */
.summary-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
  position: sticky;
  top: 100px;
}

.summary-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--green-700);
  margin-bottom: var(--space-4);
}

.summary-details {
  margin-bottom: var(--space-5);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  font-size: var(--text-base);
}

.summary-line:last-child {
  margin-bottom: 0;
}

.shipping-label {
  display: flex;
  flex-direction: column;
}

.free-shipping-note {
  font-size: var(--text-xs);
  color: var(--green-600);
  font-weight: 500;
  margin-top: 2px;
}

.summary-amount {
  font-weight: 600;
  color: var(--ink);
}

.summary-total {
  font-size: var(--text-lg);
  font-weight: 700;
  padding-top: var(--space-3);
  border-top: 1px solid var(--green-100);
  color: var(--green-700);
}

.summary-total .summary-amount {
  color: var(--green-700);
}

/* Free Shipping Progress */
.free-shipping-progress {
  margin: var(--space-3) 0;
  padding: var(--space-3);
  background: var(--yellow-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--yellow-200);
}

.progress-text {
  font-size: var(--text-sm);
  color: var(--yellow-700);
  margin-bottom: var(--space-2);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--yellow-200);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--yellow-500);
  border-radius: 3px;
  transition: width var(--transition-base);
}

/* Promo Code */
.promo-code-section {
  margin-bottom: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--green-100);
}

.promo-input-group {
  display: flex;
  gap: var(--space-2);
}

.promo-input {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.promo-input:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(47, 163, 90, 0.1);
}

/* Checkout Button */
.checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  font-weight: 600;
}

/* Security Badges */
.security-badges {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--ink-light);
}

/* Recommended Products */
.recommended-products {
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--green-100);
}

.section-title {
  font-size: var(--text-2xl);
  color: var(--green-700);
  text-align: center;
  margin-bottom: var(--space-6);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .cart-content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .summary-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .cart-page {
    padding: var(--space-4) 0 var(--space-6) 0;
  }
  
  .page-title {
    font-size: var(--text-3xl);
  }
  
  .cart-items-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .summary-card {
    padding: var(--space-4);
  }
  
  .security-badges {
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }
}

@media (max-width: 480px) {
  .empty-cart-icon {
    font-size: 4rem;
  }
  
  .empty-cart-content h2 {
    font-size: var(--text-2xl);
  }
  
  .promo-input-group {
    flex-direction: column;
  }
}
</style>