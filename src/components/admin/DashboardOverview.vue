<template>
  <div class="dashboard-overview">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon revenue">
            <MoneyIcon />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Revenue</p>
            <h3 class="stat-value">₱{{ formatNumber(analytics.summary?.totalRevenue || 0) }}</h3>
            <p class="stat-change positive">
              <span>This month: ₱{{ formatNumber(analytics.summary?.revenueThisMonth || 0) }}</span>
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orders">
            <OrderIcon />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Orders</p>
            <h3 class="stat-value">{{ analytics.summary?.totalOrders || 0 }}</h3>
            <p class="stat-change">
              <span>Today: {{ analytics.summary?.ordersToday || 0 }}</span>
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon products">
            <ProductIcon />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Products</p>
            <h3 class="stat-value">{{ analytics.summary?.totalProducts || 0 }}</h3>
            <p class="stat-change warning" v-if="analytics.summary?.lowStockProducts > 0">
              <span>{{ analytics.summary?.lowStockProducts }} low stock</span>
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon customers">
            <CustomerIcon />
          </div>
          <div class="stat-content">
            <p class="stat-label">Customers</p>
            <h3 class="stat-value">{{ analytics.summary?.totalCustomers || 0 }}</h3>
            <p class="stat-change">
              <span>Pending: {{ analytics.summary?.pendingOrders || 0 }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Sales Chart -->
        <div class="chart-card large">
          <div class="chart-header">
            <h3>Sales Overview</h3>
            <span class="chart-subtitle">Last 6 months</span>
          </div>
          <div class="chart-container">
            <div class="bar-chart">
              <div 
                v-for="(month, index) in monthlySalesData" 
                :key="index"
                class="bar-wrapper"
              >
                <div 
                  class="bar" 
                  :style="{ height: `${month.percentage}%` }"
                  :title="`₱${formatNumber(month.sales)}`"
                ></div>
                <span class="bar-label">{{ month.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Status -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Order Status</h3>
          </div>
          <div class="status-list">
            <div 
              v-for="status in orderStatusData" 
              :key="status.name"
              class="status-item"
            >
              <div class="status-info">
                <span class="status-dot" :style="{ background: status.color }"></span>
                <span class="status-name">{{ status.name }}</span>
              </div>
              <span class="status-count">{{ status.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <!-- Recent Orders -->
        <div class="card recent-orders">
          <div class="card-header">
            <h3>Recent Orders</h3>
          </div>
          <div class="orders-list">
            <div v-if="analytics.recentOrders?.length === 0" class="empty-state">
              No recent orders
            </div>
            <div 
              v-for="order in analytics.recentOrders" 
              :key="order._id"
              class="order-item"
            >
              <div class="order-info">
                <span class="order-number">{{ order.orderNumber }}</span>
                <span class="order-customer">{{ order.shippingAddress?.fullName || 'Guest' }}</span>
              </div>
              <div class="order-details">
                <span class="order-amount">₱{{ formatNumber(order.totalAmount) }}</span>
                <span class="order-status" :class="order.orderStatus">{{ order.orderStatus }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="card top-products">
          <div class="card-header">
            <h3>Top Selling Products</h3>
          </div>
          <div class="products-list">
            <div v-if="analytics.topProducts?.length === 0" class="empty-state">
              No sales data yet
            </div>
            <div 
              v-for="(product, index) in analytics.topProducts" 
              :key="product._id"
              class="product-item"
            >
              <span class="product-rank">#{{ index + 1 }}</span>
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-sold">{{ product.totalSold }} sold</span>
              </div>
              <span class="product-revenue">₱{{ formatNumber(product.revenue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth.js'

// Icons
const MoneyIcon = {
  template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
}

const OrderIcon = {
  template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`
}

const ProductIcon = {
  template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`
}

const CustomerIcon = {
  template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
}

export default {
  name: 'DashboardOverview',
  components: {
    MoneyIcon,
    OrderIcon,
    ProductIcon,
    CustomerIcon
  },
  setup() {
    const { authFetch } = useAuth()
    const isLoading = ref(true)
    const analytics = ref({})

    const formatNumber = (num) => {
      return num?.toLocaleString() || '0'
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthlySalesData = computed(() => {
      const data = analytics.value.monthlySales || []
      if (data.length === 0) return []

      const maxSales = Math.max(...data.map(d => d.sales), 1)
      return data.map(d => ({
        label: monthNames[d._id.month - 1],
        sales: d.sales,
        percentage: (d.sales / maxSales) * 100
      }))
    })

    const orderStatusData = computed(() => {
      const statusColors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        processing: '#8b5cf6',
        shipped: '#06b6d4',
        delivered: '#10b981',
        cancelled: '#ef4444'
      }

      return (analytics.value.orderStatusDistribution || []).map(s => ({
        name: s._id,
        count: s.count,
        color: statusColors[s._id] || '#6b7280'
      }))
    })

    const fetchAnalytics = async () => {
      try {
        isLoading.value = true
        const data = await authFetch('/analytics/dashboard')
        analytics.value = data
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      fetchAnalytics()
    })

    return {
      isLoading,
      analytics,
      formatNumber,
      monthlySalesData,
      orderStatusData
    }
  }
}
</script>

<style scoped>
.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2d5a27;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.revenue {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.orders {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.products {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.customers {
  background: #f3e8ff;
  color: #9333ea;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.stat-change {
  font-size: 0.8rem;
  color: #64748b;
}

.stat-change.positive {
  color: #16a34a;
}

.stat-change.warning {
  color: #d97706;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.chart-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}

.chart-container {
  height: 250px;
  display: flex;
  align-items: flex-end;
}

.bar-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 0.5rem;
  padding-bottom: 30px;
  position: relative;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  max-width: 50px;
  background: linear-gradient(180deg, #2d5a27 0%, #4a7c42 100%);
  border-radius: 6px 6px 0 0;
  min-height: 8px;
  transition: height 0.5s ease;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.85;
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* Status List */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-name {
  text-transform: capitalize;
  color: #475569;
}

.status-count {
  font-weight: 600;
  color: #1e293b;
}

/* Bottom Row */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}

/* Recent Orders */
.orders-list {
  max-height: 350px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.order-customer {
  color: #64748b;
  font-size: 0.85rem;
}

.order-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.order-amount {
  font-weight: 600;
  color: #1e293b;
}

.order-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  text-transform: capitalize;
}

.order-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.order-status.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.order-status.processing {
  background: #f3e8ff;
  color: #6b21a8;
}

.order-status.shipped {
  background: #cffafe;
  color: #155e75;
}

.order-status.delivered {
  background: #dcfce7;
  color: #166534;
}

.order-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* Top Products */
.products-list {
  max-height: 350px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  gap: 1rem;
}

.product-item:last-child {
  border-bottom: none;
}

.product-rank {
  font-weight: 700;
  color: #2d5a27;
  width: 30px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.product-sold {
  color: #64748b;
  font-size: 0.8rem;
}

.product-revenue {
  font-weight: 600;
  color: #16a34a;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .charts-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
