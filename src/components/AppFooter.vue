<template>
  <footer class="app-footer" role="contentinfo">
    <div class="container">
      <!-- Main Footer Content -->
      <div class="footer-content">
        <!-- Brand Section -->
        <div class="footer-section">
          <div class="footer-brand">
            <div class="footer-logo">
              <img class="logo-icon" src="../assets/elilysense-mark.png" alt="" aria-hidden="true">
              <div class="logo-text">
                <span class="brand-name">Water Lily</span>
                <span class="brand-sub">Handicrafts</span>
              </div>
            </div>
            <p class="footer-description">
              Sustainable artisan crafts made from water lily fiber. 
              Supporting communities, preserving traditions, protecting our planet.
            </p>
            <div class="social-links">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                class="social-link"
              >
                <FacebookIcon />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                class="social-link"
              >
                <InstagramIcon />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Pinterest"
                class="social-link"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>
        </div>

        <!-- Shop Section -->
        <div class="footer-section">
          <h3 class="footer-title">Shop</h3>
          <ul class="footer-links">
            <li><router-link to="/shop" class="footer-link">All Products</router-link></li>
            <li><router-link to="/shop?category=bags" class="footer-link">Bags</router-link></li>
            <li><router-link to="/shop?category=shoulder-bags" class="footer-link">Shoulder Bags</router-link></li>
            <li><router-link to="/shop?category=home-decor" class="footer-link">Home Decor</router-link></li>
            <li><router-link to="/shop?category=wallets" class="footer-link">Wallets</router-link></li>
            <li><router-link to="/shop?category=hats" class="footer-link">Hats</router-link></li>
          </ul>
        </div>

        <!-- Customer Care Section -->
        <div class="footer-section">
          <h3 class="footer-title">Customer Care</h3>
          <ul class="footer-links">
            <li><a href="#" class="footer-link">Shipping Info</a></li>
            <li><a href="#" class="footer-link">Returns & Exchanges</a></li>
            <li><a href="#" class="footer-link">Size Guide</a></li>
            <li><a href="#" class="footer-link">Care Instructions</a></li>
            <li><a href="#" class="footer-link">FAQ</a></li>
            <li><a href="#" class="footer-link">Contact Us</a></li>
          </ul>
        </div>

        <!-- About Section -->
        <div class="footer-section">
          <h3 class="footer-title">About</h3>
          <ul class="footer-links">
            <li><a href="#" class="footer-link">Our Story</a></li>
            <li><a href="#" class="footer-link">Artisan Partners</a></li>
            <li><a href="#" class="footer-link">Sustainability</a></li>
            <li><a href="#" class="footer-link">Fair Trade Promise</a></li>
            <li><a href="#" class="footer-link">Press</a></li>
            <li><a href="#" class="footer-link">Careers</a></li>
          </ul>
        </div>
      </div>

      <!-- Newsletter Section -->
      <div class="newsletter-section">
        <div class="newsletter-content">
          <div class="newsletter-text">
            <h3 class="newsletter-title">Stay Connected</h3>
            <p class="newsletter-description">
              Get updates about new artisan collections, sustainability stories, and exclusive offers.
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
                aria-label="Email address for newsletter"
              >
              <button 
                type="submit" 
                class="newsletter-button"
                :disabled="!email || isSigningUp"
                aria-label="Subscribe to newsletter"
              >
                <span v-if="!isSigningUp">Subscribe</span>
                <span v-else>Signing up...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Bottom Footer -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <div class="copyright">
            <p>&copy; {{ currentYear }} Water Lily Handicrafts. All rights reserved.</p>
          </div>
          <div class="footer-bottom-links">
            <a href="#" class="footer-bottom-link">Privacy Policy</a>
            <a href="#" class="footer-bottom-link">Terms of Service</a>
            <a href="#" class="footer-bottom-link">Cookie Policy</a>
          </div>
          <div class="payment-methods">
            <span class="payment-text">We accept:</span>
            <div class="payment-icons">
              <span class="payment-icon">💳</span>
              <span class="payment-icon">🏦</span>
              <span class="payment-icon">📱</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { ref, computed } from 'vue'

// Simple SVG Icons
const FacebookIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  `
}

const InstagramIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  `
}

const PinterestIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.380-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.747 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.989C24.007 5.367 18.641.001 12.017.001z"/>
    </svg>
  `
}

export default {
  name: 'AppFooter',
  components: {
    FacebookIcon,
    InstagramIcon,
    PinterestIcon
  },
  setup() {
    const email = ref('')
    const isSigningUp = ref(false)
    
    const currentYear = computed(() => new Date().getFullYear())
    
    const handleNewsletterSignup = async () => {
      if (!email.value) return
      
      isSigningUp.value = true
      
      // Simulate API call
      setTimeout(() => {
        // Show success toast
        if (window.showToast) {
          window.showToast('Thanks for subscribing! Welcome to the Water Lily family. 🌸', 'success')
        }
        
        email.value = ''
        isSigningUp.value = false
      }, 1500)
    }
    
    return {
      email,
      isSigningUp,
      currentYear,
      handleNewsletterSignup
    }
  }
}
</script>

<style scoped>
.app-footer {
  background: linear-gradient(135deg, var(--green-950) 0%, var(--green-900) 50%, var(--green-800) 100%);
  color: white;
  margin-top: auto;
  padding-top: var(--space-16);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.footer-section h3.footer-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--yellow-200);
}

.footer-brand {
  max-width: 300px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.footer-logo .logo-icon {
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  border-radius: 50%;
  flex-shrink: 0;
}

.footer-logo .brand-name {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--yellow-200);
}

.footer-logo .brand-sub {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.8);
}

.footer-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.social-links {
  display: flex;
  gap: var(--space-3);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: white;
  text-decoration: none;
  transition: all var(--transition-base);
}

.social-link:hover {
  background: var(--yellow-500);
  color: var(--ink);
  transform: translateY(-2px);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: var(--space-2);
}

.footer-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--yellow-200);
}

/* Newsletter Section */
.newsletter-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.newsletter-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.newsletter-text {
  flex: 1;
}

.newsletter-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--yellow-200);
}

.newsletter-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 0;
}

.newsletter-form {
  flex-shrink: 0;
  width: 100%;
  max-width: 400px;
}

.newsletter-input-group {
  display: flex;
  background: white;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.newsletter-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  font-size: var(--text-base);
  color: var(--ink);
}

.newsletter-input:focus {
  outline: none;
}

.newsletter-button {
  background: var(--yellow-500);
  color: var(--ink);
  border: none;
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  white-space: nowrap;
}

.newsletter-button:hover:not(:disabled) {
  background: var(--yellow-600);
}

.newsletter-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Footer Bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--space-4) 0;
}

.footer-bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.copyright p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: var(--text-sm);
}

.footer-bottom-links {
  display: flex;
  gap: var(--space-4);
}

.footer-bottom-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-fast);
}

.footer-bottom-link:hover {
  color: var(--yellow-200);
}

.payment-methods {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.payment-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--text-sm);
}

.payment-icons {
  display: flex;
  gap: var(--space-1);
}

.payment-icon {
  font-size: var(--text-lg);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  
  .newsletter-content {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: var(--space-4);
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .newsletter-section {
    padding: var(--space-4);
  }
  
  .footer-bottom-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }
  
  .footer-bottom-links {
    order: -1;
  }
  
  .payment-methods {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding-top: var(--space-6);
  }
  
  .newsletter-input-group {
    flex-direction: column;
    border-radius: var(--radius-md);
  }
  
  .newsletter-input,
  .newsletter-button {
    border-radius: 0;
  }
  
  .newsletter-input {
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }
  
  .newsletter-button {
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }
  
  .footer-bottom-links {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>