<template>
  <div class="product-page">
    <div class="container">
      <!-- Loading State -->
      <div v-if="isLoading" class="product-loading">
        <div class="product-skeleton-detail">
          <div class="skeleton-images">
            <div class="skeleton-main-image skeleton"></div>
            <div class="skeleton-thumbnails">
              <div v-for="n in 3" :key="n" class="skeleton-thumb skeleton"></div>
            </div>
          </div>
          <div class="skeleton-content">
            <div class="skeleton-title skeleton"></div>
            <div class="skeleton-price skeleton"></div>
            <div class="skeleton-rating skeleton"></div>
            <div class="skeleton-description skeleton"></div>
            <div class="skeleton-button skeleton"></div>
          </div>
        </div>
      </div>

      <!-- Product Not Found -->
      <div v-else-if="!product" class="product-not-found">
        <div class="not-found-content">
          <h1>Product not found</h1>
          <p>The product you're looking for doesn't exist or may have been removed.</p>
          <router-link to="/shop" class="btn btn-primary">
            Continue Shopping
          </router-link>
        </div>
      </div>

      <!-- Product Content -->
      <div v-else class="product-content">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/shop">Shop</router-link></li>
            <li>
              <router-link :to="`/shop?category=${product.category}`">
                {{ formatCategoryName(product.category) }}
              </router-link>
            </li>
            <li aria-current="page">{{ product.name }}</li>
          </ol>
        </nav>

        <div class="product-details">
          <!-- Product Images -->
          <div class="product-images">
            <div class="main-image-container">
              <img 
                :src="mainImage" 
                :alt="product.name"
                class="main-image"
                @click="openImageModal"
              >
              
              <!-- Image Navigation -->
              <button 
                v-if="product.images.length > 1"
                @click="previousImage"
                class="image-nav-btn image-nav-prev"
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </button>
              <button 
                v-if="product.images.length > 1"
                @click="nextImage"
                class="image-nav-btn image-nav-next"
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </button>

            </div>

            <!-- Thumbnail Images -->
            <div v-if="product.images.length > 1" class="thumbnail-images">
              <button
                v-for="(image, index) in product.images"
                :key="index"
                @click="setMainImage(index)"
                class="thumbnail-btn"
                :class="{ 'active': index === currentImageIndex }"
                :aria-label="`View image ${index + 1}`"
              >
                <img :src="image" :alt="`${product.name} view ${index + 1}`">
              </button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info">
            <header class="product-header">
              <h1 class="product-title">{{ product.name }}</h1>
              
              <div class="product-rating-reviews">
                <RatingStars :rating="product.rating" :size="20" />
                <span class="reviews-count">
                  ({{ product.reviewsCount }} reviews)
                </span>
              </div>

              <div class="product-price">
                <span class="current-price">{{ formatCurrency(product.price) }}</span>
              </div>
            </header>

            <div class="product-description">
              <p>{{ product.description }}</p>
            </div>

            <!-- Materials -->
            <div class="product-materials">
              <h3>Materials:</h3>
              <ul class="materials-list">
                <li v-for="material in product.materials" :key="material">
                  {{ material }}
                </li>
              </ul>
            </div>

            <!-- Variant Selectors -->
            <div class="product-variants">
              <!-- Size Selector -->
              <div v-if="availableSizes.length > 1" class="variant-group">
                <label class="variant-label">Size:</label>
                <div class="variant-options">
                  <button
                    v-for="size in availableSizes"
                    :key="size"
                    @click="selectedVariant.size = size"
                    class="variant-option"
                    :class="{ 'selected': selectedVariant.size === size }"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- Color Selector -->
              <div v-if="availableColors.length > 1" class="variant-group">
                <label class="variant-label">Color:</label>
                <div class="variant-options">
                  <button
                    v-for="color in availableColors"
                    :key="color"
                    @click="selectedVariant.color = color"
                    class="variant-option"
                    :class="{ 'selected': selectedVariant.color === color }"
                  >
                    {{ color }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Quantity & Add to Cart -->
            <div class="product-actions">
              <div class="quantity-selector">
                <label for="quantity" class="quantity-label">Quantity:</label>
                <div class="quantity-controls">
                  <button 
                    @click="decreaseQuantity"
                    class="quantity-btn"
                    :disabled="quantity <= 1"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    id="quantity"
                    v-model.number="quantity"
                    type="number"
                    min="1"
                    :max="currentStock"
                    class="quantity-input"
                  >
                  <button 
                    @click="increaseQuantity"
                    class="quantity-btn"
                    :disabled="quantity >= currentStock"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                @click="handleAddToCart"
                class="add-to-cart-btn btn btn-primary btn-lg"
                :disabled="currentStock === 0 || isAddingToCart"
              >
                <span v-if="!isAddingToCart">
                  <CartIcon />
                  {{ currentStock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                </span>
                <span v-else>
                  Adding to Cart...
                </span>
              </button>
            </div>

            <!-- Stock Info -->
            <div v-if="currentStock > 0 && currentStock < 10" class="stock-warning">
              Only {{ currentStock }} left in stock!
            </div>

            <!-- Product Accordions -->
            <div class="product-accordions">
              <ProductAccordion title="Materials & Care">
                <div class="accordion-content">
                  <h4>Materials:</h4>
                  <ul>
                    <li v-for="material in product.materials" :key="material">
                      {{ material }}
                    </li>
                  </ul>
                  
                  <h4>Care Instructions:</h4>
                  <ul>
                    <li>Gentle hand wash in cold water</li>
                    <li>Air dry away from direct sunlight</li>
                    <li>Store in a dry, well-ventilated area</li>
                    <li>Do not machine wash or tumble dry</li>
                  </ul>
                </div>
              </ProductAccordion>

              <ProductAccordion title="Shipping & Returns">
                <div class="accordion-content">
                  <h4>Shipping:</h4>
                  <ul>
                    <li>Free shipping on orders over ₱3,000</li>
                    <li>Standard delivery: 3-7 business days</li>
                    <li>Express delivery available</li>
                  </ul>
                  
                  <h4>Returns:</h4>
                  <ul>
                    <li>30-day return policy</li>
                    <li>Items must be in original condition</li>
                    <li>Return shipping costs may apply</li>
                  </ul>
                </div>
              </ProductAccordion>

              <ProductAccordion title="Artisan Story">
                <div class="accordion-content">
                  <p>
                    This beautiful piece is handcrafted by skilled artisans using traditional 
                    techniques passed down through generations. Each item is unique and may 
                    have slight variations that add to its handmade character.
                  </p>
                  
                  <p>
                    By purchasing this product, you're supporting sustainable practices and 
                    helping preserve traditional craftsmanship while providing fair wages 
                    to artisan communities.
                  </p>
                </div>
              </ProductAccordion>
            </div>
          </div>
        </div>

        <section class="reviews-section" aria-labelledby="reviews-title">
          <div class="reviews-heading">
            <div>
              <p class="reviews-eyebrow">From our customers</p>
              <h2 id="reviews-title">Ratings &amp; Reviews</h2>
            </div>
            <div class="reviews-summary">
              <strong>{{ Number(product.rating || 0).toFixed(1) }}</strong>
              <RatingStars :rating="Number(product.rating || 0)" :size="18" />
              <span>{{ product.reviewsCount || 0 }} ratings</span>
            </div>
          </div>

          <div class="reviews-layout">
            <p v-if="isAuthenticated && isReviewsLoading" class="reviews-empty">
              Checking your review…
            </p>

            <form
              v-else-if="isAuthenticated && !currentUserReview"
              class="review-form"
              @submit.prevent="submitReview"
            >
              <h3>Share your experience</h3>
              <p class="review-form-hint">
                Reviews are available to signed-in customers with a delivered order for this product.
              </p>

              <label class="review-field-label">Your rating</label>
              <RatingStars
                :rating="reviewRating"
                :size="24"
                interactive
                @rate="reviewRating = $event"
              />

              <label class="review-field-label" for="product-review">Your review</label>
              <textarea
                id="product-review"
                v-model.trim="reviewComment"
                rows="4"
                maxlength="2000"
                placeholder="What did you like about this handcrafted piece?"
                required
              ></textarea>
              <span class="review-character-count">{{ reviewComment.length }}/2000</span>

              <p v-if="reviewError" class="review-message error" role="alert">{{ reviewError }}</p>
              <p v-if="reviewSuccess" class="review-message success" role="status">{{ reviewSuccess }}</p>

              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isReviewSubmitting || !reviewRating || !reviewComment.trim()"
              >
                {{ isReviewSubmitting ? 'Saving review…' : 'Submit review' }}
              </button>
            </form>

            <div v-else-if="isAuthenticated && currentUserReview" class="review-submitted">
              <h3>Thank you for your feedback</h3>
              <p>{{ reviewSuccess || 'Your review has been submitted and cannot be changed.' }}</p>
              <RatingStars :rating="currentUserReview.rating" :size="20" />
              <p class="submitted-review-comment">{{ currentUserReview.comment }}</p>
            </div>

            <div v-else class="review-sign-in">
              <h3>Purchased this item?</h3>
              <p>Sign in after your order is delivered to rate and review this product.</p>
              <router-link to="/login" class="btn btn-primary">Sign in to review</router-link>
            </div>

            <div class="review-list">
              <p v-if="reviewsLoadError" class="review-message error" role="alert">
                {{ reviewsLoadError }}
              </p>
              <p v-else-if="isReviewsLoading" class="reviews-empty">Loading reviews…</p>
              <p v-else-if="reviews.length === 0" class="reviews-empty">
                No written reviews yet. Be the first verified customer to share feedback.
              </p>
              <article v-for="review in reviews" :key="review._id" class="review-card">
                <div class="review-card-heading">
                  <div>
                    <strong>{{ review.user?.name || 'Customer' }}</strong>
                    <span>{{ formatReviewDate(review.createdAt) }}</span>
                  </div>
                  <RatingStars :rating="review.rating" :size="16" />
                </div>
                <p>{{ review.comment }}</p>
              </article>
            </div>
          </div>
        </section>

        <!-- Related Products -->
        <section class="related-products">
          <h2 class="related-title">You Might Also Like</h2>
          <ProductGrid 
            v-if="relatedProducts.length > 0" 
            :products="relatedProducts" 
            :columns="4"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categories } from '../data/products.js'
import { useCart } from '../composables/useCart.js'
import { useProducts } from '../composables/useProducts.js'
import { useAuth } from '../composables/useAuth.js'
import ProductGrid from '../components/ProductGrid.vue'
import RatingStars from '../components/RatingStars.vue'
import ProductAccordion from '../components/ProductAccordion.vue'

// Icons
const ChevronLeftIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  `
}

const ChevronRightIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  `
}

const CartIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="8" cy="21" r="1"/>
      <circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6"/>
    </svg>
  `
}

export default {
  name: 'Product',
  components: {
    ProductGrid,
    RatingStars,
    ProductAccordion,
    ChevronLeftIcon,
    ChevronRightIcon,
    CartIcon
  },
  setup() {
    const route = useRoute()
    const { addToCart, formatCurrency } = useCart()
    const { fetchProductById, fetchProducts } = useProducts()
    const { user, isAuthenticated, authFetch } = useAuth()
    
    // State
    const product = ref(null)
    const relatedProducts = ref([])
    const isLoading = ref(true)
    const isAddingToCart = ref(false)
    const currentImageIndex = ref(0)
    const quantity = ref(1)
    const selectedVariant = ref({
      size: null,
      color: null
    })
    const reviews = ref([])
    const isReviewsLoading = ref(false)
    const isReviewSubmitting = ref(false)
    const reviewsLoadError = ref('')
    const reviewError = ref('')
    const reviewSuccess = ref('')
    const reviewRating = ref(0)
    const reviewComment = ref('')

    const currentUserReview = computed(() => reviews.value.find(
      review => String(review.user?._id || review.user) === String(user.value?._id)
    ))

    // Computed properties
    const mainImage = computed(() => {
      return product.value?.images[currentImageIndex.value] || ''
    })

    const availableSizes = computed(() => {
      if (!product.value?.variants) return []
      return [...new Set(product.value.variants.map(v => v.size))]
    })

    const availableColors = computed(() => {
      if (!product.value?.variants) return []
      return [...new Set(product.value.variants.map(v => v.color))]
    })

    const currentStock = computed(() => {
      if (!product.value?.variants?.length) {
        return Number(product.value?.stock) || 0
      }

      const matchingVariant = product.value.variants.find(v => 
        v.size === selectedVariant.value.size && v.color === selectedVariant.value.color
      )

      return Number(matchingVariant?.stock) || 0
    })

    // Methods
    const loadReviews = async () => {
      if (!product.value) return

      isReviewsLoading.value = true
      reviewsLoadError.value = ''
      try {
        const data = await authFetch(`/products/${product.value._id}/reviews`)
        reviews.value = data.reviews || []
        const ownReview = reviews.value.find(
          review => String(review.user?._id || review.user) === String(user.value?._id)
        )
        if (ownReview) {
          reviewRating.value = ownReview.rating
          reviewComment.value = ownReview.comment
        } else {
          reviewRating.value = 0
          reviewComment.value = ''
        }
      } catch (error) {
        console.error('Failed to load product reviews:', error)
        reviewsLoadError.value = 'Customer reviews could not be loaded. Please try again later.'
      } finally {
        isReviewsLoading.value = false
      }
    }

    const submitReview = async () => {
      if (!product.value || !reviewRating.value || !reviewComment.value.trim()) return

      isReviewSubmitting.value = true
      reviewError.value = ''
      reviewSuccess.value = ''

      try {
        const result = await authFetch(`/products/${product.value._id}/reviews`, {
          method: 'POST',
          body: JSON.stringify({
            rating: reviewRating.value,
            comment: reviewComment.value
          })
        })

        reviews.value = [
          result.review,
          ...reviews.value.filter(review => review._id !== result.review._id)
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        product.value = { ...product.value, ...result.product }
        reviewSuccess.value = 'Your review has been submitted and cannot be changed.'
      } catch (error) {
        reviewError.value = error.message || 'Your review could not be saved.'
      } finally {
        isReviewSubmitting.value = false
      }
    }

    const formatReviewDate = (date) => {
      return date
        ? new Date(date).toLocaleDateString('en-PH', { dateStyle: 'medium' })
        : ''
    }

    const loadProduct = async () => {
      try {
        isLoading.value = true
        product.value = null
        relatedProducts.value = []
        reviews.value = []
        const productId = route.params.id
        const apiProduct = await fetchProductById(productId)
        if (apiProduct) {
          product.value = {
            ...apiProduct,
            id: apiProduct._id || apiProduct.id
          }
        }
        
        if (product.value) {
          await loadReviews()

          // Set default variant selections
          if (availableSizes.value.length > 0) {
            selectedVariant.value.size = availableSizes.value[0]
          }
          if (availableColors.value.length > 0) {
            selectedVariant.value.color = availableColors.value[0]
          }
          
          const apiProducts = await fetchProducts()
          const related = apiProducts
            .filter(item => String(item._id) !== String(product.value._id))
            .map(item => ({ ...item, id: item._id || item.id }))
          const sameCategory = related.filter(item => item.category === product.value.category)
          relatedProducts.value = [
            ...sameCategory,
            ...related.filter(item => item.category !== product.value.category)
          ].slice(0, 4)
        }
        
      } catch (error) {
        console.error('Failed to load product:', error)
      } finally {
        isLoading.value = false
      }
    }

    const setMainImage = (index) => {
      currentImageIndex.value = index
    }

    const nextImage = () => {
      if (product.value && currentImageIndex.value < product.value.images.length - 1) {
        currentImageIndex.value++
      } else {
        currentImageIndex.value = 0
      }
    }

    const previousImage = () => {
      if (currentImageIndex.value > 0) {
        currentImageIndex.value--
      } else if (product.value) {
        currentImageIndex.value = product.value.images.length - 1
      }
    }

    const increaseQuantity = () => {
      if (quantity.value < currentStock.value) {
        quantity.value++
      }
    }

    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const handleAddToCart = async () => {
      if (!product.value || currentStock.value === 0) return
      
      isAddingToCart.value = true
      
      try {
        // Simulate add to cart delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const success = addToCart(
          product.value,
          selectedVariant.value.size,
          selectedVariant.value.color,
          quantity.value
        )
        
        if (success && window.showToast) {
          window.showToast(
            `Added ${quantity.value}x ${product.value.name} to cart! 🛒`, 
            'success'
          )
        }
        
      } catch (error) {
        if (window.showToast) {
          window.showToast('Failed to add item to cart. Please try again.', 'error')
        }
      } finally {
        isAddingToCart.value = false
      }
    }

    const openImageModal = () => {
      // Could implement image modal/lightbox here
      console.log('Open image modal')
    }

    const formatCategoryName = (categorySlug) => {
      const category = categories.find(cat => cat.slug === categorySlug)
      return category ? category.name : categorySlug.replace('-', ' ')
    }

    // Watch for route changes
    watch(() => route.params.id, () => {
      loadProduct()
    })

    onMounted(() => {
      loadProduct()
    })

    return {
      // Data
      product,
      relatedProducts,
      isLoading,
      isAddingToCart,
      reviews,
      isReviewsLoading,
      isReviewSubmitting,
      reviewsLoadError,
      reviewError,
      reviewSuccess,
      reviewRating,
      reviewComment,
      isAuthenticated,
      currentUserReview,
      currentImageIndex,
      quantity,
      selectedVariant,
      
      // Computed
      mainImage,
      availableSizes,
      availableColors,
      currentStock,
      
      // Methods
      setMainImage,
      nextImage,
      previousImage,
      increaseQuantity,
      decreaseQuantity,
      handleAddToCart,
      submitReview,
      formatReviewDate,
      openImageModal,
      formatCategoryName,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.product-page {
  padding: var(--space-4) 0 var(--space-8) 0;
}

/* Loading State */
.product-skeleton-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}

.skeleton-images {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-main-image {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-lg);
}

.skeleton-thumbnails {
  display: flex;
  gap: var(--space-2);
}

.skeleton-thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-title {
  height: 32px;
  width: 80%;
  border-radius: var(--radius-sm);
}

.skeleton-price {
  height: 28px;
  width: 120px;
  border-radius: var(--radius-sm);
}

.skeleton-rating {
  height: 20px;
  width: 150px;
  border-radius: var(--radius-sm);
}

.skeleton-description {
  height: 60px;
  width: 100%;
  border-radius: var(--radius-sm);
}

.skeleton-button {
  height: 52px;
  width: 200px;
  border-radius: var(--radius-md);
}

/* Product Not Found */
.product-not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.not-found-content h1 {
  font-size: var(--text-3xl);
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.not-found-content p {
  color: var(--ink-light);
  margin-bottom: var(--space-5);
}

/* Breadcrumbs */
.breadcrumbs {
  margin-bottom: var(--space-6);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.breadcrumb-list li::after {
  content: '/';
  margin-left: var(--space-2);
  color: var(--ink-light);
}

.breadcrumb-list li:last-child::after {
  display: none;
}

.breadcrumb-list a {
  color: var(--ink-light);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb-list a:hover {
  color: var(--green-600);
}

.breadcrumb-list li:last-child {
  color: var(--ink);
  font-weight: 500;
}

/* Product Details Layout */
.product-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

/* Product Images */
.main-image-container {
  position: relative;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg);
}

.main-image {
  width: 100%;
  height: 500px;
  object-fit: contain;
  cursor: zoom-in;
}

.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  color: var(--ink);
  transition: all var(--transition-fast);
  opacity: 0;
}

.main-image-container:hover .image-nav-btn {
  opacity: 1;
}

.image-nav-prev {
  left: var(--space-4);
}

.image-nav-next {
  right: var(--space-4);
}

.image-nav-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.thumbnail-images {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
}

.thumbnail-btn {
  flex-shrink: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  background: none;
  padding: 0;
}

.thumbnail-btn img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  display: block;
}

.thumbnail-btn.active {
  border-color: var(--green-500);
}

.thumbnail-btn:hover {
  border-color: var(--green-300);
}

/* Product Info */
.product-header {
  margin-bottom: var(--space-6);
}

.product-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.product-rating-reviews {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.reviews-count {
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.current-price {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--green-600);
}

.product-description {
  font-size: var(--text-lg);
  line-height: 1.7;
  color: var(--ink-light);
  margin-bottom: var(--space-6);
}

.product-materials {
  margin-bottom: var(--space-6);
}

.product-materials h3 {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-2);
}

.materials-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.materials-list li {
  background: var(--green-100);
  color: var(--green-700);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

/* Variants */
.product-variants {
  margin-bottom: var(--space-6);
}

.variant-group {
  margin-bottom: var(--space-4);
}

.variant-label {
  display: block;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-2);
}

.variant-options {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.variant-option {
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--green-200);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--text-sm);
  font-weight: 500;
}

.variant-option:hover {
  border-color: var(--green-400);
}

.variant-option.selected {
  border-color: var(--green-500);
  background: var(--green-500);
  color: white;
}

/* Product Actions */
.product-actions {
  display: flex;
  gap: var(--space-4);
  align-items: end;
  margin-bottom: var(--space-6);
}

.quantity-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quantity-label {
  font-weight: 600;
  color: var(--ink);
  font-size: var(--text-sm);
}

.quantity-controls {
  display: flex;
  border: 2px solid var(--green-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.quantity-btn {
  width: 40px;
  height: 44px;
  border: none;
  background: var(--green-50);
  color: var(--green-600);
  cursor: pointer;
  font-weight: 600;
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
  width: 60px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--green-200);
  border-right: 1px solid var(--green-200);
  font-size: var(--text-base);
  font-weight: 500;
  background: var(--surface);
}

.quantity-input:focus {
  outline: none;
}

.add-to-cart-btn {
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 600;
}

.stock-warning {
  color: var(--yellow-700);
  background: var(--yellow-100);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--space-4);
}

/* Accordions */
.product-accordions {
  margin-bottom: var(--space-8);
}

/* Customer Reviews */
.reviews-section {
  margin-bottom: var(--space-8);
  padding: var(--space-8);
  border: 1px solid var(--green-100);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #fff, #f7faf7);
}

.reviews-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--green-100);
}

.reviews-eyebrow {
  margin-bottom: var(--space-1);
  color: var(--green-700);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reviews-heading h2 {
  color: var(--green-900);
  font-size: var(--text-2xl);
}

.reviews-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink-medium);
}

.reviews-summary strong {
  color: var(--green-800);
  font-size: var(--text-2xl);
}

.reviews-layout {
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-8);
  padding-top: var(--space-6);
}

.review-form,
.review-sign-in,
.review-submitted {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--green-100);
  border-radius: var(--radius-lg);
  background: #fff;
}

.review-form h3,
.review-sign-in h3,
.review-submitted h3 {
  color: var(--green-900);
  font-size: var(--text-lg);
}

.review-form-hint,
.review-sign-in p,
.review-submitted p {
  color: var(--ink-medium);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.review-field-label {
  margin-top: var(--space-2);
  color: var(--ink);
  font-size: var(--text-sm);
  font-weight: 600;
}

.review-form textarea {
  width: 100%;
  min-height: 110px;
  padding: var(--space-3);
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  color: var(--ink);
  font: inherit;
  resize: vertical;
}

.review-form textarea:focus {
  outline: 2px solid var(--green-400);
  outline-offset: 1px;
}

.review-character-count {
  align-self: flex-end;
  color: var(--ink-light);
  font-size: var(--text-xs);
}

.review-form .btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submitted-review-comment {
  overflow-wrap: anywhere;
}

.review-message {
  font-size: var(--text-sm);
  line-height: 1.5;
}

.review-message.error {
  color: #b42318;
}

.review-message.success {
  color: var(--green-700);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.reviews-empty {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: #fff;
  color: var(--ink-medium);
  text-align: center;
}

.review-card {
  padding: var(--space-4);
  border: 1px solid var(--green-100);
  border-radius: var(--radius-lg);
  background: #fff;
}

.review-card-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.review-card-heading > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.review-card-heading strong {
  color: var(--green-900);
}

.review-card-heading span {
  color: var(--ink-light);
  font-size: var(--text-xs);
}

.review-card > p {
  color: var(--ink-medium);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

/* Related Products */
.related-products {
  border-top: 1px solid var(--green-100);
  padding-top: var(--space-8);
}

.related-title {
  font-size: var(--text-2xl);
  color: var(--green-700);
  text-align: center;
  margin-bottom: var(--space-6);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .product-details {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .product-skeleton-detail {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .reviews-section {
    padding: var(--space-5);
  }

  .reviews-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .reviews-layout {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .main-image {
    height: 400px;
  }
  
  .product-title {
    font-size: var(--text-2xl);
  }
  
  .current-price {
    font-size: var(--text-2xl);
  }
  
  .product-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-to-cart-btn {
    max-width: none;
  }
  
  .breadcrumb-list {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .product-page {
    padding: var(--space-3) 0 var(--space-6) 0;
  }
  
  .main-image {
    height: 300px;
  }
  
  .thumbnail-btn img {
    width: 60px;
    height: 60px;
  }
  
  .image-nav-btn {
    width: 36px;
    height: 36px;
  }
  
  .image-nav-prev {
    left: var(--space-2);
  }
  
  .image-nav-next {
    right: var(--space-2);
  }

  .reviews-section {
    padding: var(--space-3);
  }

  .review-form,
  .review-sign-in {
    padding: var(--space-3);
  }
}
</style>