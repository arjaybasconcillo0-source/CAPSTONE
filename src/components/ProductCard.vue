<template>
  <div class="product-card">
    <router-link 
      :to="`/product/${product._id || product.id}`" 
      class="product-link"
      :aria-label="`View ${product.name}`"
    >
      <div class="product-image-container">
        <div class="product-image">
          <img 
            :src="product.images[0]" 
            :alt="product.name"
            loading="lazy"
            class="main-image"
            @error="handleImageError($event, 0)"
          >
          <img 
            v-if="product.images[1]" 
            :src="product.images[1]" 
            :alt="`${product.name} alternate view`"
            loading="lazy"
            class="hover-image"
            @error="handleImageError($event, 1)"
          >
          
          <!-- Image Overlay -->
          <div class="image-overlay"></div>
        </div>
        
        <!-- Wishlist Button -->
        <button 
          @click.prevent="toggleWishlist"
          class="wishlist-btn"
          :class="{ 'active': isWishlisted }"
          :aria-label="`Add ${product.name} to wishlist`"
        >
          <HeartIcon />
        </button>

        <!-- Quick Add to Cart -->
        <button 
          @click.prevent="handleQuickAdd"
          class="quick-add-btn"
          :aria-label="`Add ${product.name} to cart`"
        >
          <CartIcon />
          <span>Add to Cart</span>
        </button>
      </div>

      <div class="product-info">
        <div class="product-category">{{ getCategoryName(product.category) }}</div>
        <h3 class="product-name">{{ product.name }}</h3>
        
        <div class="product-rating">
          <RatingStars :rating="product.rating" :size="14" />
          <span class="rating-count">({{ product.reviewsCount }})</span>
        </div>
        
        <div class="product-bottom">
          <div class="product-price">
            <span class="current-price">{{ formatCurrency(product.price) }}</span>
          </div>
          
          <!-- Stock indicator -->
          <div class="stock-indicator" v-if="product.stock < 10">
            <div class="stock-dot"></div>
            <span class="stock-text">{{ product.stock }} left</span>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useCart } from '../composables/useCart.js'
import RatingStars from './RatingStars.vue'

// Icon components
const CartIcon = {
  template: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="8" cy="21" r="1"/>
      <circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6"/>
    </svg>
  `
}

const HeartIcon = {
  template: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  `
}

export default {
  name: 'ProductCard',
  components: {
    RatingStars,
    CartIcon,
    HeartIcon
  },
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { addToCart, formatCurrency } = useCart()
    const isWishlisted = ref(false)

    const handleQuickAdd = () => {
      // Use default variant if available, or no variant
      const defaultVariant = props.product.variants?.[0]
      const variantSize = defaultVariant?.size || null
      const variantColor = defaultVariant?.color || null
      
      const success = addToCart(props.product, variantSize, variantColor, 1)
      
      if (success && window.showToast) {
        window.showToast(`Added ${props.product.name} to cart! 🛒`, 'success')
      }
    }

    const toggleWishlist = () => {
      isWishlisted.value = !isWishlisted.value
      if (window.showToast) {
        const message = isWishlisted.value 
          ? `Added ${props.product.name} to wishlist! ❤️` 
          : `Removed ${props.product.name} from wishlist`
        window.showToast(message, 'success')
      }
    }

    const getCategoryName = (slug) => {
      const categoryMap = {
        'bags': 'Bags',
        'shoulder-bags': 'Shoulder Bags',
        'baskets': 'Baskets',
        'home-decor': 'Home Decor',
        'wallets': 'Wallets',
        'hats': 'Hats'
      }
      return categoryMap[slug] || slug
    }

    const handleImageError = (event, imageIndex) => {
      // If first or second image fails, use the fallback image (third image)
      if (imageIndex < 2 && props.product.images[2]) {
        event.target.src = props.product.images[2];
      }
    }

    return {
      isWishlisted,
      handleQuickAdd,
      toggleWishlist,
      formatCurrency,
      getCategoryName,
      handleImageError
    }
  }
}
</script>

<style scoped>
.product-card {
  background: var(--surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-light);
  position: relative;
}

.product-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-6px);
  border-color: var(--green-200);
}

.product-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  z-index: 2;
}

/* Image Container */
.product-image-container {
  position: relative;
  overflow: hidden;
}

.product-image {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: var(--bg-subtle);
}

.main-image,
.hover-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform var(--transition-smooth);
}

.hover-image {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: scale(1.08);
  transition: all var(--transition-smooth);
}

.product-card:hover .main-image {
  transform: scale(1.08);
  opacity: 0;
}

.product-card:hover .hover-image {
  opacity: 1;
  transform: scale(1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0) 50%,
    rgba(0,0,0,0.05) 100%
  );
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.product-card:hover .image-overlay {
  opacity: 1;
}

/* Wishlist Button */
.wishlist-btn {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink-light);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 3;
}

.product-card:hover .wishlist-btn {
  opacity: 1;
  transform: scale(1);
}

.wishlist-btn:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--green-600);
  transform: scale(1.1);
}

.wishlist-btn.active {
  background: var(--green-500);
  color: white;
}

.wishlist-btn.active svg {
  fill: currentColor;
}

/* Quick Add Button */
.quick-add-btn {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  backdrop-filter: blur(12px);
  border: 2px solid var(--green-600);
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  color: var(--green-700);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
  transition: all var(--transition-base);
  white-space: nowrap;
  z-index: 3;
  box-shadow: var(--shadow-lg);
}

.product-card:hover .quick-add-btn {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.quick-add-btn:hover {
  background: var(--green-600);
  color: white;
  border-color: var(--green-600);
  transform: translateX(-50%) translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Product Info */
.product-info {
  padding: var(--space-6);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--surface);
}

.product-category {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--green-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.product-name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--green-900);
  line-height: var(--leading-snug);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rating-count {
  font-size: var(--text-xs);
  color: var(--ink-light);
  font-weight: 500;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
}

.current-price {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--green-700);
  letter-spacing: -0.02em;
}

.stock-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: rgba(254, 224, 139, 0.3);
  padding: 4px 8px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(254, 224, 139, 0.5);
}

.stock-dot {
  width: 6px;
  height: 6px;
  background: var(--yellow-600);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stock-text {
  font-size: var(--text-xs);
  color: var(--yellow-800);
  font-weight: 600;
}

/* Focus styles for accessibility */
.product-link:focus-visible {
  outline: 3px solid var(--green-500);
  outline-offset: 2px;
  border-radius: var(--radius-xl);
}

.quick-add-btn:focus-visible,
.wishlist-btn:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: 2px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .product-image {
    height: 240px;
  }
  
  .product-info {
    padding: var(--space-4);
    gap: var(--space-2);
  }
  
  .product-name {
    font-size: var(--text-base);
  }
  
  .current-price {
    font-size: var(--text-xl);
  }
  
  /* Always show buttons on mobile */
  .quick-add-btn,
  .wishlist-btn {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  
  .wishlist-btn {
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .product-image {
    height: 200px;
  }
  
  .wishlist-btn {
    width: 36px;
    height: 36px;
    top: var(--space-2);
    right: var(--space-2);
  }
  
  .quick-add-btn {
    bottom: var(--space-3);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
  }
  
  .quick-add-btn svg,
  .wishlist-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .current-price {
    font-size: var(--text-lg);
  }
}
</style>