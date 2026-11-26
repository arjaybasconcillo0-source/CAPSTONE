<template>
  <div class="dashboard-overview">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else-if="analyticsError" class="dashboard-error" role="alert">
      <p>{{ analyticsError }}</p>
      <button type="button" class="retry-button" @click="fetchAnalytics">Try again</button>
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
            <div class="chart-controls">
              <select v-model="salesBasis" class="chart-range-select" aria-label="Sales basis" @change="fetchAnalytics">
                <option value="orders">Net orders (excludes failed/refunded)</option>
                <option value="paid">Paid only</option>
              </select>
              <select v-model="salesRange" class="chart-range-select" aria-label="Sales chart range" @change="fetchAnalytics">
                <option value="all">All time</option>
                <option value="12">Last 12 months</option>
                <option value="6">Last 6 months</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <div class="bar-chart" :style="{ minWidth: monthlySalesData.length > 12 ? `${monthlySalesData.length * 52}px` : '100%' }">
              <div 
                v-for="(month, index) in monthlySalesData" 
                :key="index"
                class="bar-wrapper"
              >
                <div 
                  class="bar"
                  :class="{ 'bar-empty': month.sales === 0 }"
                  :style="{ height: `${month.percentage}%` }"
                  :title="`₱${formatNumber(month.sales)}`"
                ></div>
                <span class="bar-label">{{ month.label }}</span>
              </div>
            </div>
          </div>
          <p v-if="analyticsError" class="chart-empty-state">{{ analyticsError }}</p>
          <p v-else-if="!hasMonthlySales" class="chart-empty-state">
            {{ emptySalesMessage }}
          </p>
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
            <h3>Best-Selling Products</h3>
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

        <!-- Lowest-Selling Products -->
        <div class="card top-products">
          <div class="card-header">
            <h3>Lowest-Selling Products</h3>
          </div>
          <div class="products-list">
            <div v-if="analytics.lowSoldProducts?.length === 0" class="empty-state">
              No products available
            </div>
            <div
              v-for="product in analytics.lowSoldProducts"
              :key="product._id"
              class="product-item"
            >
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-sold">{{ product.totalSold }} sold</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="card stock-alerts">
          <div class="card-header">
            <h3>Low Stock Alerts</h3>
            <p class="stock-alert-subtitle">Fewer than 10 units remaining</p>
          </div>
          <div class="products-list">
            <div v-if="analytics.stockAlerts?.length === 0" class="empty-state">
              No products are near out of stock
            </div>
            <div
              v-for="product in analytics.stockAlerts"
              :key="product._id"
              class="product-item stock-alert-item"
            >
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-sold">{{ product.category }}</span>
              </div>
              <span class="stock-alert-count" :class="{ 'out-of-stock': product.stock === 0 }">
                {{ product.stock === 0 ? 'Out of stock' : `${product.stock} left` }}
              </span>
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
    const analyticsError = ref('')
    const salesRange = ref('all')
    const salesBasis = ref('orders')

    const formatNumber = (num) => {
      return num?.toLocaleString() || '0'
    }

    const monthlySalesData = computed(() => {
      const data = analytics.value.monthlySales || []
      const salesByMonth = new Map(
        data.map(item => [`${item._id.year}-${item._id.month}`, Number(item.sales) || 0])
      )
      const currentDate = new Date()
      const earliestSale = data.reduce((earliest, item) => {
        const saleDate = new Date(item._id.year, item._id.month - 1, 1)
        return !earliest || saleDate < earliest ? saleDate : earliest
      }, null)
      const startDate = salesRange.value === 'all' && earliestSale
        ? earliestSale
        : new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - (salesRange.value === 'all' ? 5 : Number(salesRange.value) - 1),
          1
        )
      const monthCount = (currentDate.getFullYear() - startDate.getFullYear()) * 12
        + currentDate.getMonth() - startDate.getMonth() + 1
      const months = Array.from({ length: monthCount }, (_, index) => {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1)
        const month = monthDate.getMonth() + 1
        const sales = salesByMonth.get(`${monthDate.getFullYear()}-${month}`) || 0
        return {
          label: monthDate.toLocaleString('en', { month: 'short', year: '2-digit' }),
          sales
        }
      })
      const maxSales = Math.max(...months.map(month => month.sales), 1)

      return months.map(month => ({
        ...month,
        percentage: (month.sales / maxSales) * 100
      }))
    })

    const hasMonthlySales = computed(() => monthlySalesData.value.some(month => month.sales > 0))
    const emptySalesMessage = computed(() => {
      const period = salesRange.value === 'all' ? 'yet' : `in the last ${salesRange.value} months`
      const basis = salesBasis.value === 'paid' ? 'paid sales' : 'orders'
      return `No ${basis} found ${period}.`
    })

    const salesRangeQuery = computed(
      () => `?salesRange=${salesRange.value}&salesBasis=${salesBasis.value}`
    )
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
        analyticsError.value = ''
        const data = await authFetch(`/analytics/dashboard${salesRangeQuery.value}`)
        analytics.value = data
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        analyticsError.value = 'Sales data could not be loaded. Please try again later.'
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
      salesRange,
      salesBasis,
      monthlySalesData,
      hasMonthlySales,
      emptySalesMessage,
      analyticsError,
      orderStatusData,
      fetchAnalytics
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

.dashboard-error {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 2rem;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #991b1b;
}

.dashboard-error p {
  margin: 0;
}

.retry-button {
  padding: 0.6rem 1rem;
  border: 0;
  border-radius: 6px;
  background: #991b1b;
  color: #fff;
  cursor: pointer;
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
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.chart-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.chart-range-select {
  padding: 0.4rem 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  background: white;
  font-size: 0.85rem;
}

.chart-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}

.chart-container {
  height: 250px;
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
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

.bar-empty {
  min-height: 0;
  background: #e2e8f0;
}

.bar:hover {
  opacity: 0.85;
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.chart-empty-state {
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.75rem;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.stock-alert-subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
}

.stock-alert-item {
  gap: 0.5rem;
}

.stock-alert-count {
  flex-shrink: 0;
  color: #b45309;
  font-size: 0.8rem;
  font-weight: 600;
}

.stock-alert-count.out-of-stock {
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
