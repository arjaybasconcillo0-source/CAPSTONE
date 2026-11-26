<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <img
          src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&h=800&fit=crop"
          alt="Beautiful water lily floating on serene water"
          class="hero-image"
          loading="eager"
        >
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="container">
          <div class="hero-text">
            <h1 class="hero-title">
              Handcrafted Beauty from Nature
            </h1>
            <p class="hero-description">
              Discover sustainable artisan crafts made from water lily fiber. 
              Each piece tells a story of tradition, community, and environmental stewardship.
            </p>
            <div class="hero-actions">
              <router-link to="/shop" class="btn btn-primary btn-lg">
                Shop Now
                <ShopIcon />
              </router-link>
            </div>
          </div>
        </div>
      </div>
      <div class="hero-scroll-indicator">
        <span class="scroll-text">Discover more</span>
        <div class="scroll-arrow">↓</div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section class="categories-section" id="categories">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Shop by Category</h2>
        </div>

        <div class="categories-grid">
          <CategoryCard
            v-for="category in featuredCategories"
            :key="category.id"
            :category="category"
          />
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="bestsellers-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Best Sellers</h2>
          <p class="section-description">
            Our most loved pieces, crafted with care and chosen by our community
          </p>
        </div>

        <div class="loading" v-if="isLoading">
          <ProductSkeleton v-for="n in 8" :key="n" />
        </div>

        <ProductGrid 
          v-else-if="bestSellers.length > 0"
          :products="bestSellers" 
          class="bestsellers-grid"
        />
        <p v-else class="section-description">No products added yet. Check back soon.</p>

        <div class="section-actions">
          <router-link to="/shop" class="btn btn-ghost btn-lg">
            View All Products
            <ArrowIcon />
          </router-link>
        </div>
      </div>
    </section>

    <!-- Customer Feedback -->
    <section
      v-if="reviewSummary.count > 0"
      class="customer-feedback-section"
    >
      <div class="container">
        <div class="feedback-panel">
          <div class="feedback-score">
            <span class="feedback-score-label">Average product rating</span>
            <strong>{{ reviewSummary.average.toFixed(1) }}<small>/5</small></strong>
            <RatingStars :rating="reviewSummary.average" :size="20" />
            <span class="feedback-review-count">
              Based on {{ reviewSummary.count.toLocaleString() }} product reviews
            </span>
          </div>

          <div class="feedback-copy">
            <p class="feedback-eyebrow">Customer feedback</p>
            <h2>Choose with confidence</h2>
            <p>
              Explore product ratings from shoppers and find a handcrafted piece
              that fits your style.
            </p>
            <router-link to="/shop" class="feedback-link">
              Browse customer-rated pieces
              <ArrowIcon />
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Story Section -->
    <section class="story-section">
      <div class="container">
        <div class="story-content">
          <div class="story-image">
            <img
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop"
              alt="Artisan weaving water lily fiber"
              loading="lazy"
            >
            <div class="story-badges">
              <span class="badge badge-eco">Eco-Friendly</span>
              <span class="badge badge-handmade">Handmade</span>
            </div>
          </div>
          <div class="story-text">
            <h2 class="story-title">Our Story</h2>
            <p class="story-description">
              Born from a passion for sustainable craftsmanship and community empowerment, 
              Water Lily Handicrafts partners with skilled artisans to transform discarded 
              water lily stems into beautiful, functional art.
            </p>
            
            <div class="story-highlights">
              <div class="highlight-item">
                <div class="highlight-icon">🌱</div>
                <div class="highlight-content">
                  <h3>Sustainable Materials</h3>
                  <p>Upcycling water lily stems that would otherwise become waste</p>
                </div>
              </div>
              
              <div class="highlight-item">
                <div class="highlight-icon">🤝</div>
                <div class="highlight-content">
                  <h3>Fair Trade Practices</h3>
                  <p>Supporting artisan communities with fair wages and working conditions</p>
                </div>
              </div>
              
              <div class="highlight-item">
                <div class="highlight-icon">✨</div>
                <div class="highlight-content">
                  <h3>Traditional Craftsmanship</h3>
                  <p>Preserving ancient weaving techniques for future generations</p>
                </div>
              </div>
            </div>

            <router-link to="/shop" class="btn btn-primary">
              Shop with Purpose
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter/Contact Section -->
    <section class="newsletter-section">
      <div class="container">
        <div class="newsletter-content">
          <div class="newsletter-text">
            <h2 class="newsletter-title">Join Our Community</h2>
            <p class="newsletter-description">
              Be the first to discover new collections, hear artisan stories, and get exclusive offers
            </p>
          </div>
          <form @submit.prevent="handleNewsletterSignup" class="newsletter-form">
            <div class="newsletter-input-group">
              <input
                v-model="email"
                type="email"
                placeholder="Enter your email address"
                class="newsletter-input"
                required
                :disabled="isSigningUp"
              >
              <button 
                type="submit" 
                class="newsletter-button btn btn-primary"
                :disabled="!email || isSigningUp"
              >
                <span v-if="!isSigningUp">Subscribe</span>
                <span v-else>Joining...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import handwovenBag from '../assets/handwoven-bag.png'
import { useProducts } from '../composables/useProducts.js'
import ProductGrid from '../components/ProductGrid.vue'
import ProductSkeleton from '../components/ProductSkeleton.vue'
import CategoryCard from '../components/CategoryCard.vue'
import RatingStars from '../components/RatingStars.vue'

// Simple Icons
const ShopIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  `
}

const ArrowIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="7" y1="17" x2="17" y2="7"/>
      <polyline points="7,7 17,7 17,17"/>
    </svg>
  `
}

export default {
  name: 'Home',
  components: {
    ProductGrid,
    ProductSkeleton,
    CategoryCard,
    RatingStars,
    ShopIcon,
    ArrowIcon
  },
  setup() {
    const bestSellers = ref([])
    const reviewSummary = ref({ average: 0, count: 0 })
    const isLoading = ref(true)
    const email = ref('')
    const isSigningUp = ref(false)
    const { fetchProducts } = useProducts()

    // Featured categories with images
    const featuredCategories = ref([
      {
        id: 1,
        name: 'Bags',
        slug: 'bags',
        description: 'Stylish and sustainable bags for every occasion',
        image: 'https://coopbiz.ph/wp-content/uploads/2023/10/370250153_628766599335130_8121335544811866514_n-removebg-preview-300x300.png',
        productCount: 0
      },
      {
        id: 2,
        name: 'Shoulder Bags',
        slug: 'shoulder-bags',
        description: 'Handwoven shoulder bags made with natural beauty',
        image: handwovenBag,
        productCount: 0
      },
    ])

    const loadBestSellers = async () => {
      try {
        const apiProducts = await fetchProducts()
        const availableProducts = apiProducts.map(product => ({
          ...product,
          id: product._id || product.id
        }))

        featuredCategories.value = featuredCategories.value.map(category => ({
          ...category,
          productCount: availableProducts.filter(product => product.category === category.slug).length
        }))
        const ratingTotals = availableProducts.reduce((totals, product) => {
          const count = Math.max(0, Number(product.reviewsCount) || 0)
          const rating = Number(product.rating)

          if (count > 0 && Number.isFinite(rating)) {
            totals.weightedRating += rating * count
            totals.count += count
          }

          return totals
        }, { weightedRating: 0, count: 0 })
        reviewSummary.value = {
          average: ratingTotals.count
            ? ratingTotals.weightedRating / ratingTotals.count
            : 0,
          count: ratingTotals.count
        }
        bestSellers.value = availableProducts
          .sort((a, b) =>
            Number((b.tags || []).includes('best-seller')) -
            Number((a.tags || []).includes('best-seller'))
          )
          .slice(0, 8)
      } catch (error) {
        console.error('Failed to load best sellers:', error)
        bestSellers.value = []
        reviewSummary.value = { average: 0, count: 0 }
      } finally {
        isLoading.value = false
      }
    }

    const handleNewsletterSignup = async () => {
      if (!email.value) return
      
      isSigningUp.value = true
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (window.showToast) {
          window.showToast(`Welcome to the Water Lily family! 🌸 Check your inbox for a special discount.`, 'success')
        }
        
        email.value = ''
      } catch (error) {
        if (window.showToast) {
          window.showToast('Something went wrong. Please try again.', 'error')
        }
      } finally {
        isSigningUp.value = false
      }
    }

    onMounted(() => {
      loadBestSellers()
      
      // Setup intersection observer for scroll effects
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      }, { threshold: 0.1 })
      
      // Observe sections for animations
      document.querySelectorAll('.categories-section, .bestsellers-section, .story-section').forEach(el => {
        observer.observe(el)
      })
    })

    return {
      bestSellers,
      reviewSummary,
      isLoading,
      featuredCategories,
      email,
      isSigningUp,
      handleNewsletterSignup
    }
  }
}
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  height: 100vh;
  max-height: 800px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
    rgba(11, 46, 19, 0.85) 0%,
    rgba(15, 56, 29, 0.80) 50%,
    rgba(31, 107, 58, 0.75) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  color: white;
}

.hero-text {
  max-width: 600px;
  animation: hero-fade-in 1s ease-out;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: var(--space-4);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3);
  color: white;
}

.hero-description {
  font-size: var(--text-xl);
  line-height: 1.6;
  margin-bottom: var(--space-6);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.98);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero-scroll-indicator {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  color: white;
  text-align: center;
  opacity: 0.8;
  animation: bounce 2s infinite;
  z-index: 2;
}

.scroll-text {
  display: block;
  font-size: var(--text-sm);
  margin-bottom: var(--space-1);
}

.scroll-arrow {
  font-size: var(--text-xl);
}

/* Sections */
.categories-section,
.bestsellers-section,
.customer-feedback-section,
.story-section,
.newsletter-section {
  padding: var(--space-8) 0;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.categories-section.animate-in,
.bestsellers-section.animate-in,
.story-section.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--green-900);
  margin-bottom: var(--space-4);
  letter-spacing: -0.02em;
}

.section-description {
  font-size: var(--text-lg);
  color: var(--ink-medium);
  line-height: var(--leading-relaxed);
  max-width: 60ch;
  margin: 0 auto;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

/* Best Sellers */
.bestsellers-section {
  background: var(--bg-soft);
}

.bestsellers-grid {
  margin-bottom: var(--space-6);
}

.bestsellers-grid :deep(.product-description) {
  display: none;
}

.section-actions {
  text-align: center;
}

.customer-feedback-section {
  padding: var(--space-8) 0;
}

.feedback-panel {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 4rem);
  padding: clamp(1.75rem, 5vw, 3.5rem);
  border: 1px solid var(--green-100);
  border-radius: var(--radius-xl);
  background: linear-gradient(125deg, #fff, #f3f8f4);
  box-shadow: var(--shadow-md);
}

.feedback-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-right: clamp(1rem, 3vw, 2.5rem);
  border-right: 1px solid var(--green-100);
  text-align: center;
}

.feedback-score-label,
.feedback-review-count {
  color: var(--ink-medium);
  font-size: var(--text-sm);
}

.feedback-score strong {
  color: var(--green-800);
  font-size: clamp(3rem, 6vw, 4.5rem);
  line-height: 1;
}

.feedback-score strong small {
  color: var(--ink-light);
  font-size: var(--text-xl);
  font-weight: 500;
}

.feedback-copy {
  max-width: 620px;
}

.feedback-eyebrow {
  margin-bottom: var(--space-2);
  color: var(--green-700);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.feedback-copy h2 {
  margin-bottom: var(--space-3);
  color: var(--green-900);
  font-size: var(--text-3xl);
}

.feedback-copy > p:not(.feedback-eyebrow) {
  margin-bottom: var(--space-4);
  color: var(--ink-medium);
  line-height: var(--leading-relaxed);
}

.feedback-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--green-700);
  font-weight: 700;
  text-decoration: none;
}

.feedback-link:hover {
  color: var(--green-900);
}

/* Our Story Section */
.story-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}

.story-image {
  position: relative;
}

.story-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.story-badges {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  display: flex;
  gap: var(--space-2);
}

.story-title {
  font-size: var(--text-3xl);
  color: var(--green-700);
  margin-bottom: var(--space-4);
}

.story-description {
  font-size: var(--text-lg);
  color: var(--ink-light);
  line-height: 1.7;
  margin-bottom: var(--space-6);
}

.story-highlights {
  margin-bottom: var(--space-6);
}

.highlight-item {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  align-items: flex-start;
}

.highlight-icon {
  font-size: 2rem;
  flex-shrink: 0;
  margin-top: 4px;
}

.highlight-content h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--green-700);
  margin-bottom: var(--space-1);
}

.highlight-content p {
  color: var(--ink-light);
  line-height: 1.6;
  margin-bottom: 0;
}

/* Newsletter Section */
.newsletter-section {
  background: linear-gradient(135deg, var(--green-600) 0%, var(--green-700) 100%);
  color: white;
}

.newsletter-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.newsletter-text {
  flex: 1;
}

.newsletter-title {
  font-size: var(--text-3xl);
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--yellow-100);
}

.newsletter-description {
  font-size: var(--text-lg);
  line-height: 1.6;
  opacity: 0.95;
}

.newsletter-form {
  flex-shrink: 0;
  width: 100%;
  max-width: 400px;
}

.newsletter-input-group {
  display: flex;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.newsletter-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  font-size: var(--text-base);
  color: var(--ink);
  background: transparent;
}

.newsletter-input:focus {
  outline: none;
}

.newsletter-button {
  border-radius: 0;
  white-space: nowrap;
}

/* Animations */
@keyframes hero-fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-10px);
  }
  60% {
    transform: translateX(-50%) translateY(-5px);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .story-content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .story-image {
    order: -1;
  }
  
  .newsletter-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-6);
  }
}

@media (max-width: 768px) {
  .hero-text {
    text-align: center;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .btn-lg {
    font-size: var(--text-base);
    padding: var(--space-2) var(--space-4);
  }
  
  .categories-section,
  .bestsellers-section,
  .story-section,
  .newsletter-section {
    padding: var(--space-6) 0;
  }

  .feedback-panel {
    grid-template-columns: 1fr;
    gap: var(--space-5);
    padding: var(--space-5);
  }

  .feedback-score {
    padding: 0 0 var(--space-5);
    border-right: 0;
    border-bottom: 1px solid var(--green-100);
  }

  .feedback-copy h2 {
    font-size: var(--text-2xl);
  }
  
  .section-title {
    font-size: var(--text-2xl);
  }

  .story-title,
  .newsletter-title {
    font-size: var(--text-2xl);
  }
  
  .categories-grid {
    gap: var(--space-4);
  }
  
  .newsletter-input-group {
    flex-direction: column;
  }
  
  .newsletter-button {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
}

@media (max-width: 480px) {
  .hero-section {
    height: 80vh;
  }
  
  .hero-actions {
    flex-direction: column;
  }

  .highlight-item {
    flex-direction: column;
    gap: var(--space-2);
    text-align: center;
  }
  
  .highlight-icon {
    margin-top: 0;
  }
}
</style>