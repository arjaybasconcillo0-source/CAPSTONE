<template>
  <div id="app">
    <!-- Navigation Bar (hidden on admin) -->
    <NavBar v-if="!isAdminRoute" />
    
    <!-- Main Content -->
    <main class="main-content" :class="{ 'admin-layout': isAdminRoute }">
      <router-view />
    </main>
    
    <!-- Footer (hidden on admin) -->
    <AppFooter v-if="!isAdminRoute" />
    
    <!-- Cart Drawer (if you want a drawer instead of separate page) -->
    <!-- <CartDrawer v-if="isCartOpen" @close="closeCart" /> -->
    
    <!-- Toast Notifications -->
    <Toast 
      v-if="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="hideToast" 
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
import Toast from './components/Toast.vue'

export default {
  name: 'App',
  components: {
    NavBar,
    AppFooter,
    Toast
  },
  setup() {
    const route = useRoute()
    
    // Check if current route is admin
    const isAdminRoute = computed(() => route.path.startsWith('/admin'))
    // Toast notification system
    const toast = ref({
      show: false,
      message: '',
      type: 'success' // success, error, warning, info
    })

    const showToast = (message, type = 'success') => {
      toast.value = {
        show: true,
        message,
        type
      }
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        toast.value.show = false
      }, 4000)
    }

    const hideToast = () => {
      toast.value.show = false
    }

    // Provide toast function globally
    window.showToast = showToast

    return {
      toast,
      showToast,
      hideToast,
      isAdminRoute
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 80px; /* Account for fixed navbar */
}

.main-content.admin-layout {
  padding-top: 0;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>