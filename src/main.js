import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/css/styles.css'

// Import pages
import Home from './pages/Home.vue'
import Shop from './pages/Shop.vue'
import Product from './pages/Product.vue'
import Cart from './pages/Cart.vue'
import Checkout from './pages/Checkout.vue'
import Login from './pages/Login.vue'
import Admin from './pages/Admin.vue'

// Import auth composable for route guards
import { useAuth } from './composables/useAuth.js'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/shop', name: 'Shop', component: Shop },
    { path: '/product/:id', name: 'Product', component: Product },
    { path: '/cart', name: 'Cart', component: Cart },
    { path: '/checkout', name: 'Checkout', component: Checkout },
    { path: '/login', name: 'Login', component: Login },
    { 
      path: '/admin', 
      name: 'Admin', 
      component: Admin,
      meta: { requiresAdmin: true }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

// Navigation guard for admin routes
router.beforeEach((to, from, next) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (to.meta.requiresAdmin) {
    if (!isAuthenticated.value) {
      next({ name: 'Login' })
    } else if (!isAdmin.value) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')