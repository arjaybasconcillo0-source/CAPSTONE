<template>
  <div class="checkout-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Checkout</h1>
        <div class="checkout-steps">
          <div class="step" :class="{ 'active': currentStep === 1 }">
            <span class="step-number">1</span>
            <span class="step-label">Shipping</span>
          </div>
          <div class="step" :class="{ 'active': currentStep === 2 }">
            <span class="step-number">2</span>
            <span class="step-label">Payment</span>
          </div>
          <div class="step" :class="{ 'active': currentStep === 3 }">
            <span class="step-number">3</span>
            <span class="step-label">Review</span>
          </div>
        </div>
      </div>

      <div class="checkout-content">
        <!-- Checkout Form -->
        <div class="checkout-form">
          <form @submit.prevent="handleSubmit">
            <!-- Step 1: Shipping Information -->
            <div v-if="currentStep === 1" class="checkout-step">
              <h2 class="step-title">Shipping Information</h2>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="firstName" class="form-label">First Name *</label>
                  <input
                    id="firstName"
                    v-model="shippingInfo.firstName"
                    type="text"
                    class="form-input"
                    required
                    :class="{ 'error': errors.firstName }"
                  >
                  <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
                </div>
                
                <div class="form-group">
                  <label for="lastName" class="form-label">Last Name *</label>
                  <input
                    id="lastName"
                    v-model="shippingInfo.lastName"
                    type="text"
                    class="form-input"
                    required
                    :class="{ 'error': errors.lastName }"
                  >
                  <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="form-label">Email Address *</label>
                <input
                  id="email"
                  v-model="shippingInfo.email"
                  type="email"
                  class="form-input"
                  required
                  :class="{ 'error': errors.email }"
                >
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">Phone Number *</label>
                <input
                  id="phone"
                  v-model="shippingInfo.phone"
                  type="tel"
                  class="form-input"
                  required
                  :class="{ 'error': errors.phone }"
                >
                <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
              </div>

              <div class="form-group">
                <label for="address" class="form-label">Street Address *</label>
                <input
                  id="address"
                  v-model="shippingInfo.address"
                  type="text"
                  class="form-input"
                  required
                  :class="{ 'error': errors.address }"
                >
                <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label for="city" class="form-label">City *</label>
                  <input
                    id="city"
                    v-model="shippingInfo.city"
                    type="text"
                    class="form-input"
                    required
                    :class="{ 'error': errors.city }"
                  >
                  <span v-if="errors.city" class="error-message">{{ errors.city }}</span>
                </div>
                
                <div class="form-group">
                  <label for="postalCode" class="form-label">Postal Code *</label>
                  <input
                    id="postalCode"
                    v-model="shippingInfo.postalCode"
                    type="text"
                    class="form-input"
                    required
                    :class="{ 'error': errors.postalCode }"
                  >
                  <span v-if="errors.postalCode" class="error-message">{{ errors.postalCode }}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="notes" class="form-label">Delivery Notes (Optional)</label>
                <textarea
                  id="notes"
                  v-model="shippingInfo.notes"
                  class="form-textarea"
                  rows="3"
                  placeholder="Any special instructions for delivery..."
                ></textarea>
              </div>

              <div class="step-actions">
                <button type="button" @click="nextStep" class="btn btn-primary btn-lg">
                  Continue to Payment
                  <ChevronRightIcon />
                </button>
              </div>
            </div>

            <!-- Step 2: Payment Information -->
            <div v-if="currentStep === 2" class="checkout-step">
              <h2 class="step-title">Payment Information</h2>
              
              <div class="payment-methods">
                <h3>Choose Payment Method</h3>
                <div class="payment-options">
                  <label class="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      v-model="paymentInfo.method"
                    >
                    <div class="payment-option-content">
                      <div class="payment-icon">💳</div>
                      <div class="payment-details">
                        <span class="payment-title">Credit/Debit Card</span>
                        <span class="payment-subtitle">Visa, Mastercard, etc.</span>
                      </div>
                    </div>
                  </label>

                  <label class="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      v-model="paymentInfo.method"
                    >
                    <div class="payment-option-content">
                      <div class="payment-icon">🏦</div>
                      <div class="payment-details">
                        <span class="payment-title">Bank Transfer</span>
                        <span class="payment-subtitle">Direct bank payment</span>
                      </div>
                    </div>
                  </label>

                  <label class="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      v-model="paymentInfo.method"
                    >
                    <div class="payment-option-content">
                      <div class="payment-icon">💰</div>
                      <div class="payment-details">
                        <span class="payment-title">Cash on Delivery</span>
                        <span class="payment-subtitle">Pay when you receive</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Card Payment Form (shown if card is selected) -->
              <div v-if="paymentInfo.method === 'card'" class="card-payment-form">
                <div class="form-group">
                  <label for="cardNumber" class="form-label">Card Number *</label>
                  <input
                    id="cardNumber"
                    v-model="paymentInfo.cardNumber"
                    type="text"
                    class="form-input"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    @input="formatCardNumber"
                  >
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label for="expiryDate" class="form-label">Expiry Date *</label>
                    <input
                      id="expiryDate"
                      v-model="paymentInfo.expiryDate"
                      type="text"
                      class="form-input"
                      placeholder="MM/YY"
                      maxlength="5"
                      @input="formatExpiryDate"
                    >
                  </div>
                  
                  <div class="form-group">
                    <label for="cvv" class="form-label">CVV *</label>
                    <input
                      id="cvv"
                      v-model="paymentInfo.cvv"
                      type="text"
                      class="form-input"
                      placeholder="123"
                      maxlength="4"
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label for="cardName" class="form-label">Cardholder Name *</label>
                  <input
                    id="cardName"
                    v-model="paymentInfo.cardName"
                    type="text"
                    class="form-input"
                    placeholder="Name as it appears on card"
                  >
                </div>
              </div>

              <div class="step-actions">
                <button type="button" @click="previousStep" class="btn btn-ghost">
                  <ChevronLeftIcon />
                  Back to Shipping
                </button>
                <button type="button" @click="nextStep" class="btn btn-primary btn-lg">
                  Review Order
                  <ChevronRightIcon />
                </button>
              </div>
            </div>

            <!-- Step 3: Order Review -->
            <div v-if="currentStep === 3" class="checkout-step">
              <h2 class="step-title">Review Your Order</h2>
              
              <!-- Order Items -->
              <div class="order-review">
                <h3>Order Items</h3>
                <div class="review-items">
                  <div 
                    v-for="item in cartItemsWithDetails" 
                    :key="item.id"
                    class="review-item"
                  >
                    <img :src="item.product.images[0]" :alt="item.product.name">
                    <div class="review-item-details">
                      <span class="review-item-name">{{ item.product.name }}</span>
                      <span class="review-item-meta">
                        {{ item.variantSize ? `Size: ${item.variantSize}` : '' }}
                        {{ item.variantColor ? ` • Color: ${item.variantColor}` : '' }}
                        • Qty: {{ item.quantity }}
                      </span>
                    </div>
                    <span class="review-item-price">{{ formatCurrency(item.subtotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Shipping & Payment Summary -->
              <div class="order-summary-info">
                <div class="info-section">
                  <h4>Shipping Address</h4>
                  <p>
                    {{ shippingInfo.firstName }} {{ shippingInfo.lastName }}<br>
                    {{ shippingInfo.address }}<br>
                    {{ shippingInfo.city }}, {{ shippingInfo.postalCode }}<br>
                    {{ shippingInfo.phone }}
                  </p>
                </div>

                <div class="info-section">
                  <h4>Payment Method</h4>
                  <p>{{ getPaymentMethodLabel() }}</p>
                </div>
              </div>

              <div class="step-actions">
                <button type="button" @click="previousStep" class="btn btn-ghost">
                  <ChevronLeftIcon />
                  Back to Payment
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg"
                  :disabled="isSubmitting"
                >
                  <span v-if="!isSubmitting">
                    Place Order
                    <CheckIcon />
                  </span>
                  <span v-else>
                    Processing Order...
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="order-summary-sidebar">
          <div class="summary-card">
            <h2 class="summary-title">Order Summary</h2>
            
            <!-- Mini Cart Items -->
            <div class="mini-cart-items">
              <div 
                v-for="item in cartItemsWithDetails" 
                :key="item.id"
                class="mini-cart-item"
              >
                <img :src="item.product.images[0]" :alt="item.product.name">
                <div class="mini-item-info">
                  <span class="mini-item-name">{{ item.product.name }}</span>
                  <span class="mini-item-qty">Qty: {{ item.quantity }}</span>
                </div>
                <span class="mini-item-price">{{ formatCurrency(item.subtotal) }}</span>
              </div>
            </div>

            <!-- Summary Totals -->
            <div class="summary-details">
              <div class="summary-line">
                <span>Subtotal</span>
                <span>{{ formatCurrency(cartSubtotal) }}</span>
              </div>
              <div class="summary-line">
                <span>Shipping</span>
                <span>{{ shippingFee === 0 ? 'Free' : formatCurrency(shippingFee) }}</span>
              </div>
              <div class="summary-line summary-total">
                <span>Total</span>
                <span>{{ formatCurrency(cartTotal) }}</span>
              </div>
            </div>

            <!-- Security Info -->
            <div class="security-info">
              <div class="security-badge">
                <ShieldIcon />
                <span>Secure SSL Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <OrderSuccessModal 
      v-if="showSuccessModal"
      :order-number="orderNumber"
      @close="goToHome"
    />
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart.js'
import OrderSuccessModal from '../components/OrderSuccessModal.vue'

// Icons
const ChevronRightIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  `
}

const ChevronLeftIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  `
}

const CheckIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"/>
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

export default {
  name: 'Checkout',
  components: {
    OrderSuccessModal,
    ChevronRightIcon,
    ChevronLeftIcon,
    CheckIcon,
    ShieldIcon
  },
  setup() {
    const router = useRouter()
    const {
      cartItemsWithDetails,
      cartCount,
      cartSubtotal,
      cartTotal,
      shippingFee,
      formatCurrency,
      clearCart
    } = useCart()

    // State
    const currentStep = ref(1)
    const isSubmitting = ref(false)
    const showSuccessModal = ref(false)
    const orderNumber = ref('')

    // Form data
    const shippingInfo = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      notes: ''
    })

    const paymentInfo = reactive({
      method: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: ''
    })

    const errors = reactive({})

    // Methods
    const validateCurrentStep = () => {
      errors.value = {}
      let isValid = true

      if (currentStep.value === 1) {
        // Validate shipping information
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode']
        
        requiredFields.forEach(field => {
          if (!shippingInfo[field] || !shippingInfo[field].trim()) {
            errors[field] = 'This field is required'
            isValid = false
          }
        })

        // Email validation
        if (shippingInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
          errors.email = 'Please enter a valid email address'
          isValid = false
        }
      } else if (currentStep.value === 2) {
        // Validate payment information
        if (!paymentInfo.method) {
          isValid = false
        }

        if (paymentInfo.method === 'card') {
          if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName) {
            isValid = false
          }
        }
      }

      return isValid
    }

    const nextStep = () => {
      if (validateCurrentStep()) {
        if (currentStep.value < 3) {
          currentStep.value++
        }
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--
      }
    }

    const formatCardNumber = (event) => {
      let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value
      
      if (formattedValue.length > 19) {
        formattedValue = formattedValue.substring(0, 19)
      }
      
      paymentInfo.cardNumber = formattedValue
    }

    const formatExpiryDate = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4)
      }
      
      paymentInfo.expiryDate = value
    }

    const getPaymentMethodLabel = () => {
      const labels = {
        card: 'Credit/Debit Card',
        bank: 'Bank Transfer',
        cod: 'Cash on Delivery'
      }
      return labels[paymentInfo.method] || ''
    }

    const generateOrderNumber = () => {
      return 'WL' + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 4).toUpperCase()
    }

    const handleSubmit = async () => {
      if (!validateCurrentStep()) return

      isSubmitting.value = true

      try {
        // Simulate order processing
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Generate order number
        orderNumber.value = generateOrderNumber()

        // Clear cart
        clearCart()

        // Show success modal
        showSuccessModal.value = true

      } catch (error) {
        console.error('Order submission failed:', error)
        
        if (window.showToast) {
          window.showToast('Order submission failed. Please try again.', 'error')
        }
      } finally {
        isSubmitting.value = false
      }
    }

    const goToHome = () => {
      showSuccessModal.value = false
      router.push('/')
    }

    // Redirect if cart is empty
    onMounted(() => {
      if (cartCount.value === 0) {
        router.push('/cart')
      }
    })

    return {
      // State
      currentStep,
      isSubmitting,
      showSuccessModal,
      orderNumber,
      shippingInfo,
      paymentInfo,
      errors,

      // Cart
      cartItemsWithDetails,
      cartCount,
      cartSubtotal,
      cartTotal,
      shippingFee,
      formatCurrency,

      // Methods
      nextStep,
      previousStep,
      handleSubmit,
      formatCardNumber,
      formatExpiryDate,
      getPaymentMethodLabel,
      goToHome
    }
  }
}
</script>

<style scoped>
.checkout-page {
  padding: var(--space-6) 0 var(--space-8) 0;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--green-700);
  margin-bottom: var(--space-4);
}

/* Checkout Steps */
.checkout-steps {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  opacity: 0.5;
  transition: opacity var(--transition-base);
}

.step.active {
  opacity: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  background: var(--green-100);
  color: var(--green-700);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

.step.active .step-number {
  background: var(--green-500);
  color: white;
}

.step-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
}

/* Checkout Content */
.checkout-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-8);
  align-items: start;
}

/* Checkout Form */
.checkout-form {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.step-title {
  font-size: var(--text-2xl);
  color: var(--green-700);
  margin-bottom: var(--space-6);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: 600;
  color: var(--ink);
  font-size: var(--text-sm);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--green-200);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(47, 163, 90, 0.1);
}

.form-input.error {
  border-color: var(--error);
}

.error-message {
  color: var(--error);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
  display: block;
}

.form-textarea {
  resize: vertical;
}

/* Payment Methods */
.payment-methods {
  margin-bottom: var(--space-6);
}

.payment-methods h3 {
  font-size: var(--text-lg);
  color: var(--ink);
  margin-bottom: var(--space-4);
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.payment-option {
  display: block;
  cursor: pointer;
}

.payment-option input[type="radio"] {
  display: none;
}

.payment-option-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 2px solid var(--green-200);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.payment-option input:checked + .payment-option-content {
  border-color: var(--green-500);
  background: var(--green-50);
}

.payment-icon {
  font-size: 2rem;
}

.payment-details {
  display: flex;
  flex-direction: column;
}

.payment-title {
  font-weight: 600;
  color: var(--ink);
}

.payment-subtitle {
  font-size: var(--text-sm);
  color: var(--ink-light);
}

.card-payment-form {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--bg);
  border-radius: var(--radius-md);
}

/* Order Review */
.order-review {
  margin-bottom: var(--space-6);
}

.order-review h3 {
  font-size: var(--text-lg);
  color: var(--ink);
  margin-bottom: var(--space-4);
}

.review-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.review-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg);
  border-radius: var(--radius-md);
}

.review-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.review-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.review-item-name {
  font-weight: 600;
  color: var(--ink);
}

.review-item-meta {
  font-size: var(--text-xs);
  color: var(--ink-light);
}

.review-item-price {
  font-weight: 600;
  color: var(--green-600);
}

.order-summary-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.info-section h4 {
  font-size: var(--text-base);
  color: var(--ink);
  margin-bottom: var(--space-2);
}

.info-section p {
  color: var(--ink-light);
  line-height: 1.6;
  font-size: var(--text-sm);
}

.step-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-6);
  border-top: 1px solid var(--green-100);
}

/* Order Summary Sidebar */
.order-summary-sidebar {
  position: sticky;
  top: 100px;
}

.summary-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
}

.summary-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--green-700);
  margin-bottom: var(--space-4);
}

.mini-cart-items {
  margin-bottom: var(--space-5);
}

.mini-cart-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--green-100);
}

.mini-cart-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.mini-cart-item img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.mini-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-item-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
}

.mini-item-qty {
  font-size: var(--text-xs);
  color: var(--ink-light);
}

.mini-item-price {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--green-600);
}

.summary-details {
  margin-bottom: var(--space-5);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.summary-total {
  font-weight: 700;
  font-size: var(--text-lg);
  padding-top: var(--space-3);
  border-top: 1px solid var(--green-100);
  color: var(--green-700);
}

.security-info {
  text-align: center;
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--ink-light);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .checkout-content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .order-summary-sidebar {
    position: static;
    order: -1;
  }
  
  .order-summary-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .checkout-page {
    padding: var(--space-4) 0 var(--space-6) 0;
  }
  
  .page-title {
    font-size: var(--text-3xl);
  }
  
  .checkout-steps {
    gap: var(--space-4);
  }
  
  .step-label {
    display: none;
  }
  
  .checkout-form,
  .summary-card {
    padding: var(--space-4);
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .step-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .step-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .checkout-steps {
    gap: var(--space-2);
  }
  
  .payment-option-content {
    padding: var(--space-3);
  }
  
  .payment-icon {
    font-size: 1.5rem;
  }
}
</style>