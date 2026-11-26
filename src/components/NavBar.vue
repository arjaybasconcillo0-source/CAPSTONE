<template>
  <header class="navbar" role="banner">
    <div class="container">
      <nav class="navbar-content" role="navigation" aria-label="Main navigation">
        <!-- Logo/Brand -->
        <router-link 
          to="/" 
          class="navbar-brand"
          @click="closeSearch"
        >
          <div class="logo">
            <img class="logo-icon" src="../assets/elilysense-mark.png" alt="" aria-hidden="true">
            <div class="logo-text">
              <span class="brand-name">Water Lily</span>
              <span class="brand-sub">Handicrafts</span>
            </div>
          </div>
        </router-link>

        <!-- Search Bar (Desktop) -->
        <div class="search-container desktop-search">
          <form @submit.prevent="handleSearch" class="search-form" role="search">
            <div class="search-input-group">
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search handcrafted treasures..."
                class="search-input"
                aria-label="Search products"
                @focus="showSearchSuggestions = true"
                @blur="hideSearchSuggestionsLater"
              >
              <button 
                type="submit" 
                class="search-button"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>
            
            <!-- Search Suggestions -->
            <div 
              v-if="showSearchSuggestions && searchSuggestions.length > 0"
              class="search-suggestions"
              role="listbox"
            >
              <button
                v-for="suggestion in searchSuggestions"
                :key="suggestion"
                @mousedown.prevent="selectSuggestion(suggestion)"
                class="search-suggestion"
                role="option"
              >
                {{ suggestion }}
              </button>
            </div>
          </form>
        </div>

        <!-- Navigation Actions -->
        <div class="navbar-actions">
          <!-- Mobile Search Toggle -->
          <button
            class="nav-button mobile-search-toggle"
            @click="toggleMobileSearch"
            aria-label="Toggle search"
          >
            <SearchIcon />
          </button>

          <router-link to="/track-order" class="nav-button track-order-link">
            Track Order
          </router-link>

          <!-- Cart -->
          <router-link 
            to="/cart" 
            class="nav-button cart-button"
            aria-label="Shopping cart"
          >
            <div class="cart-icon-wrapper">
              <CartIcon />
              <span 
                v-if="cartCount > 0" 
                class="cart-badge"
                aria-label="`${cartCount} items in cart`"
              >
                {{ cartCount > 99 ? '99+' : cartCount }}
              </span>
            </div>
          </router-link>

          <!-- User Actions (Desktop) -->
          <div class="user-actions desktop-only">
            <template v-if="isAuthenticated">
              <router-link to="/settings" class="nav-button settings-button">
                Settings
              </router-link>
              <router-link 
                v-if="isAdmin" 
                to="/admin" 
                class="nav-button admin-button"
                aria-label="Admin dashboard"
              >
                <AdminIcon />
              </router-link>
              <button 
                @click="handleLogout" 
                class="nav-button logout-button"
                aria-label="Logout"
              >
                <LogoutIcon />
              </button>
            </template>
            <router-link 
              v-else 
              to="/login" 
              class="nav-button login-button"
              aria-label="Login"
            >
              <UserIcon />
            </router-link>
          </div>

          <!-- Menu Toggle (Mobile) -->
          <button
            class="nav-button menu-toggle"
            @click="toggleMobileMenu"
            aria-label="Toggle navigation menu"
            aria-expanded="false"
          >
            <MenuIcon v-if="!showMobileMenu" />
            <CloseIcon v-else />
          </button>
        </div>
      </nav>

      <!-- Mobile Search (Hidden by default) -->
      <div 
        v-if="showMobileSearch" 
        class="mobile-search"
        @click.self="closeMobileSearch"
      >
        <form @submit.prevent="handleSearch" class="search-form mobile-search-form">
          <div class="search-input-group">
            <input
              ref="mobileSearchInput"
              v-model="searchQuery"
              type="search"
              placeholder="Search handcrafted treasures..."
              class="search-input"
              aria-label="Search products"
              @keydown.escape="closeMobileSearch"
            >
            <button 
              type="submit" 
              class="search-button"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          </div>
        </form>
      </div>

      <!-- Mobile Menu -->
      <div 
        v-if="showMobileMenu" 
        class="mobile-menu"
        role="menu"
      >
        <nav class="mobile-nav">
          <router-link 
            to="/" 
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Home
          </router-link>
          <router-link 
            to="/shop" 
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Shop All
          </router-link>
          <router-link 
            to="/shop?category=bags" 
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Bags
          </router-link>
          <router-link 
            to="/shop?category=shoulder-bags" 
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Shoulder Bags
          </router-link>
          <router-link 
            to="/shop?category=home-decor" 
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Home Decor
          </router-link>
          <router-link
            to="/track-order"
            class="mobile-nav-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Track Order
          </router-link>
          
          <!-- Auth Links (Mobile) -->
          <div class="mobile-nav-divider"></div>
          
          <template v-if="isAuthenticated">
            <div class="mobile-user-info">
              Signed in as {{ userName }}
            </div>
            <router-link
              to="/settings"
              class="mobile-nav-link"
              @click="closeMobileMenu"
              role="menuitem"
            >
              Settings
            </router-link>
            <router-link 
              v-if="isAdmin"
              to="/admin" 
              class="mobile-nav-link admin-link"
              @click="closeMobileMenu"
              role="menuitem"
            >
              Admin Dashboard
            </router-link>
            <button 
              @click="handleLogout" 
              class="mobile-nav-link logout-link"
              role="menuitem"
            >
              Logout
            </button>
          </template>
          <router-link 
            v-else
            to="/login" 
            class="mobile-nav-link login-link"
            @click="closeMobileMenu"
            role="menuitem"
          >
            Login / Sign Up
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart.js'
import { useAuth } from '../composables/useAuth.js'
import { useProducts } from '../composables/useProducts.js'

// Simple SVG Icons as inline components
const SearchIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
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

const MenuIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="4" x2="20" y1="12" y2="12"/>
      <line x1="4" x2="20" y1="6" y2="6"/>
      <line x1="4" x2="20" y1="18" y2="18"/>
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

const UserIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `
}

const AdminIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
  `
}

const LogoutIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  `
}

export default {
  name: 'NavBar',
  components: {
    SearchIcon,
    CartIcon,
    MenuIcon,
    CloseIcon,
    UserIcon,
    AdminIcon,
    LogoutIcon
  },
  setup() {
    const router = useRouter()
    const { cartCount } = useCart()
    const { isAuthenticated, isAdmin, userName, logout } = useAuth()
    const { fetchProducts } = useProducts()
    const availableProducts = ref([])

    // Handle logout
    const handleLogout = () => {
      logout()
      if (window.showToast) {
        window.showToast('Logged out successfully', 'success')
      }
      router.push('/')
    }

    // Component state
    const searchQuery = ref('')
    const showSearchSuggestions = ref(false)
    const showMobileSearch = ref(false)
    const showMobileMenu = ref(false)
    const mobileSearchInput = ref(null)

    // Search suggestions based on products
    const searchSuggestions = computed(() => {
      if (!searchQuery.value || searchQuery.value.length < 2) return []
      
      const query = searchQuery.value.toLowerCase()
      const suggestions = new Set()
      
      availableProducts.value.forEach(product => {
        // Add product names that match
        if (product.name.toLowerCase().includes(query)) {
          suggestions.add(product.name)
        }
        
        // Add categories that match
        if (product.category.toLowerCase().includes(query)) {
          suggestions.add(product.category.replace('-', ' ').toLowerCase())
        }
        
        // Add materials that match
        product.materials.forEach(material => {
          if (material.toLowerCase().includes(query)) {
            suggestions.add(material)
          }
        })
      })
      
      return Array.from(suggestions).slice(0, 6)
    })

    // Methods
    const handleSearch = () => {
      if (!searchQuery.value.trim()) return
      
      closeMobileSearch()
      closeSearch()
      
      router.push({
        path: '/shop',
        query: { search: searchQuery.value.trim() }
      })
    }

    const selectSuggestion = (suggestion) => {
      searchQuery.value = suggestion
      handleSearch()
    }

    const hideSearchSuggestionsLater = () => {
      setTimeout(() => {
        showSearchSuggestions.value = false
      }, 200)
    }

    const toggleMobileSearch = () => {
      showMobileSearch.value = !showMobileSearch.value
      
      if (showMobileSearch.value) {
        nextTick(() => {
          mobileSearchInput.value?.focus()
        })
      }
    }

    const closeMobileSearch = () => {
      showMobileSearch.value = false
    }

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }

    const closeMobileMenu = () => {
      showMobileMenu.value = false
    }

    const closeSearch = () => {
      showSearchSuggestions.value = false
    }

    // Close mobile menus when clicking outside
    onMounted(async () => {
      availableProducts.value = await fetchProducts()
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
          showMobileMenu.value = false
          showMobileSearch.value = false
          showSearchSuggestions.value = false
        }
      })
    })

    return {
      searchQuery,
      showSearchSuggestions,
      showMobileSearch,
      showMobileMenu,
      mobileSearchInput,
      searchSuggestions,
      cartCount,
      handleSearch,
      selectSuggestion,
      hideSearchSuggestionsLater,
      toggleMobileSearch,
      closeMobileSearch,
      toggleMobileMenu,
      closeMobileMenu,
      closeSearch,
      isAuthenticated,
      isAdmin,
      userName,
      handleLogout
    }
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  z-index: var(--z-fixed);
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.98);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  gap: var(--space-4);
}

/* Logo & Branding */
.navbar-brand {
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border-radius: 50%;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-name {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--green-700);
}

.brand-sub {
  font-size: var(--text-sm);
  color: var(--ink-light);
  font-weight: 400;
}

/* Search */
.search-container {
  flex: 1;
  max-width: 500px;
  position: relative;
}

.search-form {
  position: relative;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  padding-right: 50px;
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  background: var(--bg-subtle);
  transition: all var(--transition-fast);
  font-family: inherit;
}

.search-input:hover {
  border-color: var(--green-300);
  background: var(--surface);
}

.search-input:focus {
  outline: none;
  border-color: var(--green-500);
  background: var(--surface);
  box-shadow: 0 0 0 4px var(--green-50);
}

.search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--green-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.search-button:hover {
  background: var(--green-600);
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  margin-top: 4px;
}

.search-suggestion {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border-bottom: 1px solid var(--green-100);
}

.search-suggestion:last-child {
  border-bottom: none;
}

.search-suggestion:hover {
  background: var(--green-50);
}

/* Navigation Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  color: var(--ink);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.nav-button:hover {
  background: var(--green-50);
  color: var(--green-600);
}

.nav-button:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: 2px;
}

.track-order-link {
  width: auto;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
}

.cart-icon-wrapper {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--yellow-500);
  color: var(--green-900);
  font-size: 10px;
  font-weight: var(--font-bold);
  padding: 3px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
  line-height: 1;
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--surface);
}

/* Mobile Search */
.mobile-search {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--green-200);
  box-shadow: var(--shadow-md);
  padding: var(--space-3);
  z-index: 999;
}

.mobile-search-form .search-input {
  border-radius: var(--radius-md);
}

/* Mobile Menu */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--green-200);
  box-shadow: var(--shadow-lg);
  z-index: 999;
}

.mobile-nav {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mobile-nav-link {
  padding: var(--space-3) var(--space-2);
  text-decoration: none;
  color: var(--ink);
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.mobile-nav-link:hover {
  background: var(--green-50);
  color: var(--green-600);
}

/* Responsive Design */
.mobile-search-toggle,
.menu-toggle {
  display: none;
}

@media (max-width: 768px) {
  .desktop-search {
    display: none;
  }
  
  .mobile-search-toggle,
  .menu-toggle {
    display: flex;
  }
  
  .navbar-content {
    height: 60px;
  }
  
  .logo-text {
    display: none;
  }
  
  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .track-order-link {
    display: none;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--space-3);
  }
  
  .brand-name {
    font-size: var(--text-lg);
  }
  
  .brand-sub {
    font-size: var(--text-xs);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .navbar,
  .nav-button,
  .search-input,
  .search-button {
    transition: none;
  }
}

/* User Actions */
.user-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.admin-button {
  color: var(--green-600);
}

.admin-button:hover {
  background: var(--green-100);
}

.logout-button:hover {
  background: #fee2e2;
  color: #dc2626;
}

.login-button:hover {
  background: var(--green-100);
  color: var(--green-700);
}

.desktop-only {
  display: flex;
}

/* Mobile Nav Divider */
.mobile-nav-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--space-2) 0;
}

.mobile-user-info {
  padding: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink-light);
}

.mobile-nav-link.admin-link {
  color: var(--green-600);
  font-weight: 600;
}

.mobile-nav-link.logout-link {
  color: #dc2626;
  background: none;
  border: none;
  text-align: left;
  width: 100%;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}

.mobile-nav-link.login-link {
  color: var(--green-600);
  font-weight: 600;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
</style>