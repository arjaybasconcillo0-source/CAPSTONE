
<template>
  <div class="admin-dashboard">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <img class="logo-icon" src="../assets/elilysense-mark.png" alt="" aria-hidden="true">
          <span v-if="!sidebarCollapsed" class="logo-text">Water Lily</span>
        </div>

        <button
          @click="sidebarCollapsed = !sidebarCollapsed"
          class="collapse-btn"
          aria-label="Toggle sidebar"
        >
          <ChevronIcon :class="{ rotated: sidebarCollapsed }" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="activeTab = item.id"
          class="nav-item"
          :class="{ active: activeTab === item.id }"
        >
          <component :is="item.icon" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <HomeIcon />
          <span v-if="!sidebarCollapsed">View Store</span>
        </router-link>

        <button @click="handleLogout" class="nav-item logout-btn">
          <LogoutIcon />
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main" :class="{ expanded: sidebarCollapsed }">
      <!-- Top Bar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
          <p class="page-subtitle">Water Lily Handicrafts Administration</p>
        </div>

        <div class="topbar-right">
          <div class="admin-profile">
            <span class="admin-name">{{ userName }}</span>
            <div class="admin-avatar">{{ userInitials }}</div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="admin-content">
        <DashboardOverview v-if="activeTab === 'dashboard'" />

        <ProductsManagement v-else-if="activeTab === 'products'" />

        <OrdersManagement v-else-if="activeTab === 'orders'" />

        <InventoryManagement v-else-if="activeTab === 'inventory'" />

        <AnalyticsView v-else-if="activeTab === 'analytics'" />

        <IoTController v-else-if="activeTab === 'iot'" />

        <CameraViewing v-else-if="activeTab === 'test'" />

        <SettingsView v-else-if="activeTab === 'settings'" />

      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

// Admin Components
import DashboardOverview from '../components/admin/DashboardOverview.vue'
import ProductsManagement from '../components/admin/ProductsManagement.vue'
import OrdersManagement from '../components/admin/OrdersManagement.vue'
import InventoryManagement from '../components/admin/InventoryManagement.vue'
import AnalyticsView from '../components/admin/AnalyticsView.vue'
import IoTController from '../components/admin/IoTController.vue'
import CameraViewing from '../components/admin/test.vue'
import SettingsView from './Settings.vue'

// Dashboard Icon
const DashboardIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  `
}

// Products Icon
const ProductsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  `
}

// Orders Icon
const OrdersIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  `
}

// Inventory Icon
const InventoryIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  `
}

// Analytics Icon
const AnalyticsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  `
}

// IoT Icon
const IoTIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="2"/>
      <path d="M12 2a10 10 0 0 0-10 10"/>
      <path d="M12 6a6 6 0 0 0-6 6"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 6a6 6 0 0 1 6 6"/>
    </svg>
  `
}

// Camera viewing icon
const CameraIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="6" width="13" height="12" rx="2"/>
      <path d="m16 10 5-3v10l-5-3"/>
    </svg>
  `
}

const SettingsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.33 2.67l-.08-.08a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.33l.06-.06A1.65 1.65 0 0 0 5.2 15a1.65 1.65 0 0 0-1.51-1H3.6a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
  `
}

// Chevron Icon
const ChevronIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  `
}

// Logout Icon
const LogoutIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  `
}

// Home Icon
const HomeIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  `
}

export default {
  name: 'AdminDashboard',

  components: {
    DashboardOverview,
    ProductsManagement,
    OrdersManagement,
    InventoryManagement,
    AnalyticsView,
    IoTController,
    CameraViewing,
    SettingsView,
    DashboardIcon,
    ProductsIcon,
    OrdersIcon,
    InventoryIcon,
    AnalyticsIcon,
    IoTIcon,
    CameraIcon,
    SettingsIcon,
    ChevronIcon,
    LogoutIcon,
    HomeIcon
  },

  setup() {
    const router = useRouter()
    const { isAuthenticated, isAdmin, userName, logout } = useAuth()

    // Check admin access
    onMounted(() => {
      if (!isAuthenticated.value || !isAdmin.value) {
        router.push('/login')
      }
    })

    const sidebarCollapsed = ref(false)
    const activeTab = ref('dashboard')

    // Admin navigation items
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
      { id: 'products', label: 'Products', icon: ProductsIcon },
      { id: 'orders', label: 'Orders', icon: OrdersIcon },
      { id: 'inventory', label: 'Inventory', icon: InventoryIcon },
      { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
      { id: 'iot', label: 'IoT Control', icon: IoTIcon },
      { id: 'test', label: 'Camera Viewing', icon: CameraIcon },
      { id: 'settings', label: 'Settings', icon: SettingsIcon }
    ]

    const currentPageTitle = computed(() => {
      const item = navItems.find(item => item.id === activeTab.value)
      return item ? item.label : 'Dashboard'
    })

    const userInitials = computed(() => {
      return userName.value
        ? userName.value.charAt(0).toUpperCase()
        : 'A'
    })

    const handleLogout = () => {
      logout()
      router.push('/')
    }

    return {
      sidebarCollapsed,
      activeTab,
      navItems,
      currentPageTitle,
      userName,
      userInitials,
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}

.admin-sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid #334155;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: cover;
  border-radius: 50%;
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
}

.collapse-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: white;
}

.collapse-btn svg.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
  font-size: 0.95rem;
  text-decoration: none;
}

.nav-item:hover {
  background: #334155;
  color: white;
}

.nav-item.active {
  background: #2d5a27;
  color: white;
}

.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.logout-btn {
  color: #f87171;
}

.logout-btn:hover {
  background: #7f1d1d;
  color: white;
}

/* Main Content */
.admin-main {
  flex: 1;
  margin-left: 260px;
  min-width: 0;
  transition: margin-left 0.3s ease;
}

.admin-main.expanded {
  margin-left: 70px;
}

.admin-topbar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-name {
  font-weight: 500;
  color: #475569;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2d5a27;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.admin-content {
  padding: 2rem;
  min-height: calc(100vh - 73px);
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-sidebar {
    width: 70px;
  }

  .admin-sidebar .logo-text,
  .admin-sidebar .nav-item span {
    display: none;
  }

  .admin-main {
    margin-left: 70px;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 70px;
  }

  .admin-main {
    margin-left: 70px;
  }

  .admin-content {
    padding: 1rem;
  }

  .admin-topbar {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.2rem;
  }

  .page-subtitle {
    display: none;
  }

  .admin-name {
    display: none;
  }
}
</style>
