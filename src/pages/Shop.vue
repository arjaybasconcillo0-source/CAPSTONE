<template>
  <div class="shop-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          {{ pageTitle }}
        </h1>
        <p class="page-description">
          Discover handcrafted treasures made from sustainable water lily fiber
        </p>
      </div>

      <div class="shop-content">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar" :class="{ 'mobile-open': showMobileFilters }">
          <div class="filters-header">
            <h2 class="filters-title">Filters</h2>
            <button 
              class="mobile-close-btn"
              @click="showMobileFilters = false"
              aria-label="Close filters"
            >
              <CloseIcon />
            </button>
          </div>

          <div class="filters-content">
            <!-- Category Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Category</h3>
              <div class="filter-options">
                <label 
                  v-for="category in categories" 
                  :key="category.id"
                  class="filter-option"
                >
                  <input
                    type="radio"
                    name="category"
                    :value="category.slug"
                    v-model="filters.category"
                    @change="handleCategoryChange"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="filter-label">{{ category.name }}</span>
                </label>
                <label class="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    v-model="filters.category"
                    @change="handleCategoryChange"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="filter-label">All Categories</span>
                </label>
              </div>
            </div>

            <!-- Sort Filter -->
            <div class="filter-group">
              <h3 class="filter-title">Sort By</h3>
              <select 
                v-model="filters.sortBy" 
                @change="handleSortChange"
                class="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <button 
              @click="clearFilters"
              class="clear-filters-btn btn btn-ghost"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="shop-main">
          <!-- Mobile Controls -->
          <div class="mobile-controls">
            <button 
              @click="showMobileFilters = true"
              class="mobile-filters-btn btn btn-ghost"
            >
              <FilterIcon />
              Filters
            </button>
            
            <select 
              v-model="filters.sortBy" 
              @change="handleSortChange"
              class="mobile-sort-select"
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <!-- Results Info -->
          <div class="results-info">
            <p class="results-count">
              Showing {{ visibleProducts.length }} of {{ filteredProducts.length }} products
              <span v-if="searchQuery" class="search-query">
                for \"{{ searchQuery }}\"
              </span>
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-grid">
            <ProductSkeleton v-for="n in 12" :key="n" />
          </div>

          <!-- No Results -->
          <div v-else-if="filteredProducts.length === 0" class="no-results">
            <div class="no-results-content">
              <div class="no-results-icon">🔍</div>
              <h3>{{ totalProducts === 0 ? 'No products added yet' : 'No products found' }}</h3>
              <p v-if="productLoadError">{{ productLoadError }}</p>
              <p v-else-if="totalProducts === 0">Add products from Admin to display them here.</p>
              <p v-else>Try adjusting your filters or search terms.</p>
              <button v-if="totalProducts > 0" @click="clearFilters" class="btn btn-primary">
                Clear Filters
              </button>
            </div>
          </div>

          <!-- Products Grid -->
          <ProductGrid 
            v-else
            :products="visibleProducts"
            :columns="4"
            class="shop-grid"
          />

          <!-- Load More / Pagination -->
          <div v-if="hasMoreProducts" class="load-more-section">
            <button 
              @click="loadMore"
              class="btn btn-ghost btn-lg"
              :disabled="isLoadingMore"
            >
              <span v-if="!isLoadingMore">Load More Products</span>
              <span v-else>Loading...</span>
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile Filters Overlay -->
    <div 
      v-if="showMobileFilters"
      class="mobile-filters-overlay"
      @click="showMobileFilters = false"
    ></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router' 
import { categories } from '../data/products.js'
import { useProducts } from '../composables/useProducts.js'
import ProductGrid from '../components/ProductGrid.vue'
import ProductSkeleton from '../components/ProductSkeleton.vue'

// Icons
const FilterIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
    </svg>
  `
}

const CloseIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  `
}

export default {
  name: 'Shop',
  components: {
    ProductGrid,
    ProductSkeleton,
    FilterIcon,
    CloseIcon
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { fetchProducts: fetchApiProducts, error: productLoadError } = useProducts()
    
    // State
    const allProducts = ref([])
    const filteredProducts = ref([])
    const isLoading = ref(true)
    const isLoadingMore = ref(false)
    const showMobileFilters = ref(false)
    const displayLimit = ref(12)
    
    // Filters
    const filters = ref({
      category: '',
      sortBy: 'featured'
    })
    
    const searchQuery = ref('')

    // Computed
    const totalProducts = computed(() => allProducts.value.length)
    const visibleProducts = computed(
      () => filteredProducts.value.slice(0, displayLimit.value)
    )
    const hasMoreProducts = computed(
      () => filteredProducts.value.length > displayLimit.value
    )
    
    const pageTitle = computed(() => {
      if (searchQuery.value) {
        return `Search Results`
      }
      if (filters.value.category) {
        const category = categories.find(cat => cat.slug === filters.value.category)
        return category ? category.name : 'Shop'
      }
      return 'All Products'
    })

    // Methods
    const loadProducts = async () => {
      try {
        isLoading.value = true
        
        const apiProducts = await fetchApiProducts()
        allProducts.value = apiProducts.map(product => ({
          ...product,
          id: product._id || product.id
        }))
        applyFilters()
        
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const applyFilters = () => {
      let result = [...allProducts.value]
      
      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(product =>
          [product.name, product.description, ...(product.tags || [])]
            .some(value => String(value || '').toLowerCase().includes(query))
        )
      }
      
      // Apply category filter
      if (filters.value.category) {
        result = result.filter(product => product.category === filters.value.category)
      }
      
      // Apply sorting
      switch (filters.value.sortBy) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price)
          break
        case 'price-high':
          result.sort((a, b) => b.price - a.price)
          break
        case 'newest':
          result.sort((a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
          break
        case 'rating':
          result.sort((a, b) => b.rating - a.rating)
          break
        case 'featured':
        default:
          // Featured items (best sellers) first, then by ID
          result.sort((a, b) => {
            const aFeatured = (a.tags || []).includes('best-seller') ? 1 : 0
            const bFeatured = (b.tags || []).includes('best-seller') ? 1 : 0
            if (aFeatured !== bFeatured) return bFeatured - aFeatured
            return String(a.name).localeCompare(String(b.name))
          })
          break
      }
      
      filteredProducts.value = result
      
      // Update URL to reflect current filters
      updateURL()
    }

    const handleCategoryChange = (event) => {
      filters.value.category = event.target.value
      displayLimit.value = 12
      applyFilters()
    }

    const handleSortChange = (event) => {
      filters.value.sortBy = event.target.value
      displayLimit.value = 12
      applyFilters()
    }
    
    const updateURL = () => {
      const query = {}
      
      if (searchQuery.value) query.search = searchQuery.value
      if (filters.value.category) query.category = filters.value.category
      if (filters.value.sortBy !== 'featured') query.sort = filters.value.sortBy
      
      router.replace({ query })
    }
    
    const clearFilters = () => {
      filters.value = {
        category: '',
        sortBy: 'featured'
      }
      searchQuery.value = ''
      displayLimit.value = 12
      applyFilters()
    }
    
    const loadMore = async () => {
      isLoadingMore.value = true
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      displayLimit.value += 12
      applyFilters()
      
      isLoadingMore.value = false
    }

    // Initialize from URL params
    const initializeFromURL = () => {
      const query = route.query
      
      if (query.search) searchQuery.value = query.search
      if (query.category) filters.value.category = query.category
      if (query.sort) filters.value.sortBy = query.sort
    }

    onMounted(() => {
      initializeFromURL()
      loadProducts()
    })

    // Watch for route changes (like direct navigation)
    watch(() => route.query, () => {
      initializeFromURL()
      applyFilters()
    })

    return {
      // Data
      filteredProducts,
      visibleProducts,
      isLoading,
      isLoadingMore,
      showMobileFilters,
      filters,
      searchQuery,
      productLoadError,
      categories,
      
      // Computed
      totalProducts,
      hasMoreProducts,
      pageTitle,
      
      // Methods
      applyFilters,
      handleCategoryChange,
      handleSortChange,
      clearFilters,
      loadMore
    }
  }
}
</script>

<style scoped>
.shop-page {
  padding: var(--space-6) 0;
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
  margin-bottom: var(--space-3);
}

.page-description {
  font-size: var(--text-lg);
  color: var(--ink-light);
  max-width: 600px;
  margin: 0 auto;
}

.shop-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 100px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  height: fit-content;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.filters-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--green-700);
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  color: var(--ink-light);
  cursor: pointer;
  padding: var(--space-1);
}

.filter-group {
  margin-bottom: var(--space-6);
}

.filter-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.filter-option:hover {
  color: var(--green-600);
}

.filter-option input[type=\"radio\"],
.filter-option input[type=\"checkbox\"] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--green-300);
  border-radius: var(--radius-sm);
  background: var(--surface);
  position: relative;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.filter-option input:checked + .checkbox-custom {
  background: var(--green-500);
  border-color: var(--green-500);
}

.filter-option input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.filter-label {
  font-size: var(--text-sm);
  user-select: none;
}

.sort-select,
.mobile-sort-select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: var(--text-sm);
  cursor: pointer;
}

.sort-select:focus,
.mobile-sort-select:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(47, 163, 90, 0.1);
}

.clear-filters-btn {
  width: 100%;
  margin-top: var(--space-4);
}

/* Main Content */
.shop-main {
  min-height: 600px;
}

.mobile-controls {
  display: none;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  gap: var(--space-3);
}

.mobile-filters-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.mobile-sort-select {
  max-width: 200px;
}

.results-info {
  margin-bottom: var(--space-6);
}

.results-count {
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.search-query {
  color: var(--green-600);
  font-weight: 500;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
}

.shop-grid {
  margin-bottom: var(--space-8);
}

.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.no-results-content {
  text-align: center;
  max-width: 400px;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.no-results h3 {
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.no-results p {
  color: var(--ink-light);
  margin-bottom: var(--space-4);
}

.load-more-section {
  text-align: center;
}

/* Mobile Styles */
.mobile-filters-overlay {
  display: none;
}

@media (max-width: 1024px) {
  .shop-content {
    grid-template-columns: 1fr;
  }
  
  .filters-sidebar {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 1001;
    padding: var(--space-6);
    overflow-y: auto;
    border-radius: 0;
  }
  
  .filters-sidebar.mobile-open {
    display: block;
  }
  
  .mobile-close-btn {
    display: block;
  }
  
  .mobile-controls {
    display: flex;
  }
  
  .mobile-filters-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
}

@media (max-width: 768px) {
  .shop-page {
    padding: var(--space-4) 0;
  }
  
  .page-title {
    font-size: var(--text-3xl);
  }
  
  .page-description {
    font-size: var(--text-base);
  }
  
  .mobile-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .mobile-sort-select {
    max-width: none;
  }
  
  .loading-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }
}

@media (max-width: 480px) {
  .filters-sidebar {
    padding: var(--space-4);
  }
  
  .no-results-icon {
    font-size: 3rem;
  }
  
  .loading-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }
}
</style>