<template>
  <div class="cart-item" :class="{ 'updating': disabled }">
    <div class="item-image">
      <router-link :to="`/product/${item.product.id}`">
        <img 
          :src="item.product.images[0]" 
          :alt="item.product.name"
          loading="lazy"
        >
      </router-link>
    </div>

    <div class="item-details">
      <div class="item-info">
        <h3 class="item-name">
          <router-link :to="`/product/${item.product.id}`">
            {{ item.product.name }}
          </router-link>
        </h3>
        
        <div class="item-meta">
          <span v-if="item.variantSize" class="variant">
            Size: {{ item.variantSize }}
          </span>
          <span v-if="item.variantColor" class="variant">
            Color: {{ item.variantColor }}
          </span>
        </div>
        
        <div class="item-price">
          <span class="unit-price">{{ formatCurrency(item.product.price) }} each</span>
        </div>
      </div>

      <div class="item-actions">
        <!-- Quantity Controls -->
        <div class="quantity-controls">
          <label class="quantity-label">Qty:</label>
          <div class="quantity-input-group">
            <button 
              @click="updateQuantity(item.quantity - 1)"
              class="quantity-btn"
              :disabled="disabled || item.quantity <= 1"
              aria-label="Decrease quantity"
            >
              <MinusIcon />
            </button>
            <input
              :value="item.quantity"
              @input="onQuantityInput"
              @blur="onQuantityBlur"
              type="number"
              min="1"
              :max="getMaxQuantity()"
              class="quantity-input"
              :disabled="disabled"
            >
            <button 
              @click="updateQuantity(item.quantity + 1)"
              class="quantity-btn"
              :disabled="disabled || item.quantity >= getMaxQuantity()"
              aria-label="Increase quantity"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <!-- Remove Button -->
        <button 
          @click="removeItem"
          class="remove-btn"
          :disabled="disabled"
          aria-label="Remove item from cart"
        >
          <TrashIcon />
          <span class="remove-text">Remove</span>
        </button>
      </div>
    </div>

    <div class="item-total">
      <div class="total-price">{{ formatCurrency(item.subtotal) }}</div>
      
      <!-- Stock Warning -->
      <div v-if="stockWarning" class="stock-warning">
        {{ stockWarning }}
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="disabled" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { formatCurrency } from '../composables/useCart.js'

// Icons
const MinusIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  `
}

const PlusIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  `
}

const TrashIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  `
}

export default {
  name: 'CartItem',
  components: {
    MinusIcon,
    PlusIcon,
    TrashIcon
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update-quantity', 'remove'],
  setup(props, { emit }) {
    const tempQuantity = ref(props.item.quantity)

    const stockWarning = computed(() => {
      const maxStock = getMaxQuantity()
      if (maxStock === 0) {
        return 'Out of stock'
      }
      if (maxStock < 5 && maxStock < props.item.quantity) {
        return `Only ${maxStock} available`
      }
      if (maxStock < 5) {
        return `Only ${maxStock} left in stock`
      }
      return null
    })

    const getMaxQuantity = () => {
      if (!props.item.product.variants) {
        return props.item.product.stock || 0
      }

      const matchingVariant = props.item.product.variants.find(v => 
        v.size === props.item.variantSize && v.color === props.item.variantColor
      )

      return matchingVariant?.stock || 0
    }

    const updateQuantity = (newQuantity) => {
      const maxStock = getMaxQuantity()
      const clampedQuantity = Math.max(1, Math.min(newQuantity, maxStock))
      
      if (clampedQuantity !== props.item.quantity) {
        emit('update-quantity', props.item.id, clampedQuantity)
      }
    }

    const onQuantityInput = (event) => {
      tempQuantity.value = parseInt(event.target.value) || 1
    }

    const onQuantityBlur = () => {
      updateQuantity(tempQuantity.value)
    }

    const removeItem = () => {
      emit('remove', props.item.id)
    }

    return {
      tempQuantity,
      stockWarning,
      getMaxQuantity,
      updateQuantity,
      onQuantityInput,
      onQuantityBlur,
      removeItem,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.cart-item {
  position: relative;
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.cart-item.updating {
  opacity: 0.7;
  pointer-events: none;
}

.cart-item:hover:not(.updating) {
  box-shadow: var(--shadow-md);
}

/* Item Image */
.item-image {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg);
}

.item-image a {
  display: block;
  width: 100%;
  height: 100%;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.item-image:hover img {
  transform: scale(1.05);
}

/* Item Details */
.item-details {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-3);
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.item-name a {
  text-decoration: none;
  color: var(--ink);
  transition: color var(--transition-fast);
}

.item-name a:hover {
  color: var(--green-600);
}

.item-meta {
  margin-bottom: var(--space-2);
  display: flex;
  gap: var(--space-3);
}

.variant {
  font-size: var(--text-sm);
  color: var(--ink-light);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.item-price .unit-price {
  color: var(--ink-light);
  font-size: var(--text-sm);
}

/* Item Actions */
.item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.quantity-label {
  font-size: var(--text-sm);
  color: var(--ink);
  font-weight: 500;
}

.quantity-input-group {
  display: flex;
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.quantity-btn {
  width: 32px;
  height: 36px;
  border: none;
  background: var(--green-50);
  color: var(--green-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.quantity-btn:hover:not(:disabled) {
  background: var(--green-100);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 50px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--green-200);
  border-right: 1px solid var(--green-200);
  font-size: var(--text-sm);
  background: var(--surface);
}

.quantity-input:focus {
  outline: none;
  background: var(--green-50);
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  color: var(--ink-light);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.remove-btn:hover:not(:disabled) {
  color: var(--error);
  background: rgba(229, 62, 62, 0.1);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-text {
  font-weight: 500;
}

/* Item Total */
.item-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  text-align: right;
}

.total-price {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--green-600);
  margin-bottom: var(--space-1);
}

.stock-warning {
  font-size: var(--text-xs);
  color: var(--yellow-700);
  background: var(--yellow-100);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--green-200);
  border-top: 2px solid var(--green-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 80px 1fr;
    grid-template-rows: 1fr auto;
    gap: var(--space-3);
  }
  
  .item-image {
    width: 80px;
    height: 80px;
  }
  
  .item-total {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-3);
    border-top: 1px solid var(--green-100);
  }
  
  .item-actions {
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  
  .quantity-controls {
    order: 2;
  }
  
  .remove-btn {
    order: 1;
  }
  
  .remove-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .cart-item {
    padding: var(--space-3);
    gap: var(--space-2);
  }
  
  .item-image {
    width: 60px;
    height: 60px;
  }
  
  .item-name {
    font-size: var(--text-base);
  }
  
  .item-meta {
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .total-price {
    font-size: var(--text-lg);
  }
  
  .quantity-input-group {
    transform: scale(0.9);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>