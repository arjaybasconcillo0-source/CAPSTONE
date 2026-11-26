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
import TrackOrder from './pages/TrackOrder.vue'
import Login from './pages/Login.vue'
import Admin from './pages/Admin.vue'
import Settings from './pages/Settings.vue'

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
    { path: '/checkout', name: 'Checkout', component: Checkout, meta: { requiresAuth: true } },
    { path: '/track-order', name: 'TrackOrder', component: TrackOrder, meta: { requiresAuth: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
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
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (!isAdmin.value) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')