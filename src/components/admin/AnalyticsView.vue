<template>
  <div class="analytics-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <p class="header-subtitle">Detailed sales and revenue analytics</p>
      </div>
      <div class="date-filter">
        <select v-model="dateRange" @change="fetchAnalytics">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- Revenue Overview Cards -->
      <div class="stats-row">
        <div class="stat-card revenue">
          <div class="stat-icon">
            <RevenueIcon />
          </div>
          <div class="stat-content">
            <span class="stat-value">₱{{ formatNumber(salesData.totalRevenue) }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>
        </div>
        <div class="stat-card orders">
          <div class="stat-icon">
            <OrdersIcon />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ salesData.totalOrders }}</span>
            <span class="stat-label">Total Orders</span>
          </div>
        </div>
        <div class="stat-card average">
          <div class="stat-icon">
            <AvgIcon />
          </div>
          <div class="stat-content">
            <span class="stat-value">₱{{ formatNumber(salesData.averageOrderValue) }}</span>
            <span class="stat-label">Avg Order Value</span>
          </div>
        </div>
        <div class="stat-card conversion">
          <div class="stat-icon">
            <ConversionIcon />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ salesData.conversionRate }}%</span>
            <span class="stat-label">Conversion Rate</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Monthly Sales Chart -->
        <div class="chart-card large">
          <div class="chart-header">
            <h3>Monthly Sales Trend</h3>
          </div>
          <div class="chart-container">
            <div class="bar-chart">
              <div v-for="(item, index) in salesData.monthlySales" :key="index" class="bar-item">
                <div class="bar-wrapper">
                  <div 
                    class="bar" 
                    :style="{ height: getBarHeight(item.revenue) + '%' }"
                    :title="'₱' + formatNumber(item.revenue)"
                  ></div>
                </div>
                <span class="bar-label">{{ item.month }}</span>
                <span class="bar-value">₱{{ formatShort(item.revenue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods Pie -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Payment Methods</h3>
          </div>
          <div class="pie-chart-container">
            <div class="pie-chart">
              <svg viewBox="0 0 100 100">
                <circle 
                  v-for="(segment, index) in paymentSegments" 
                  :key="index"
                  cx="50" cy="50" r="40"
                  fill="none"
                  :stroke="segment.color"
                  stroke-width="20"
                  :stroke-dasharray="segment.dashArray"
                  :stroke-dashoffset="segment.offset"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div class="pie-center">
                <span class="pie-total">{{ salesData.paymentMethods?.total || 0 }}</span>
                <span class="pie-label">Orders</span>
              </div>
            </div>
            <div class="pie-legend">
              <div v-for="method in paymentMethodsList" :key="method.name" class="legend-item">
                <span class="legend-color" :style="{ background: method.color }"></span>
                <span class="legend-name">{{ method.label }}</span>
                <span class="legend-value">{{ method.count }} ({{ method.percent }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Performance -->
      <div class="performance-section">
        <div class="section-header">
          <h3>Category Performance</h3>
        </div>
        <div class="category-performance">
          <div v-for="cat in salesData.categoryRevenue" :key="cat.category" class="category-row">
            <div class="category-info">
              <span class="category-name">{{ cat.category }}</span>
              <span class="category-orders">{{ cat.orders }} orders</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getCategoryPercent(cat.revenue) + '%' }"></div>
            </div>
            <span class="category-revenue">₱{{ formatNumber(cat.revenue) }}</span>
          </div>
        </div>
      </div>

      <!-- Top Products & Recent Orders -->
      <div class="two-col-section">
        <!-- Top Products -->
        <div class="data-card">
          <div class="card-header">
            <h3>Top Selling Products</h3>
          </div>
          <div class="products-list">
            <div v-for="(product, index) in salesData.topProducts" :key="product._id" class="product-row">
              <span class="rank">{{ index + 1 }}</span>
              <img :src="product.images?.[0]" :alt="product.name" class="product-image" />
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-sales">{{ product.totalSold }} sold</span>
              </div>
              <span class="product-revenue">₱{{ formatNumber(product.totalRevenue) }}</span>
            </div>
          </div>
        </div>

        <!-- Order Status Distribution -->
        <div class="data-card">
          <div class="card-header">
            <h3>Order Status Distribution</h3>
          </div>
          <div class="status-list">
            <div v-for="status in orderStatuses" :key="status.name" class="status-row">
              <div class="status-info">
                <span class="status-dot" :class="status.name"></span>
                <span class="status-name">{{ capitalize(status.name) }}</span>
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar" :class="status.name" :style="{ width: status.percent + '%' }"></div>
              </div>
              <span class="status-count">{{ status.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue by Date -->
      <div class="daily-revenue-section">
        <div class="section-header">
          <h3>Daily Revenue (Last 14 Days)</h3>
        </div>
        <div class="daily-chart">
          <div class="line-chart">
            <svg viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#2d5a27;stop-opacity:0.2" />
                  <stop offset="100%" style="stop-color:#2d5a27;stop-opacity:0" />
                </linearGradient>
              </defs>
              <path :d="areaPath" fill="url(#lineGradient)" />
              <path :d="linePath" fill="none" stroke="#2d5a27" stroke-width="2" />
              <circle 
                v-for="(point, index) in dailyPoints" 
                :key="index" 
                :cx="point.x" 
                :cy="point.y" 
                r="4" 
                fill="#2d5a27"
              />
            </svg>
          </div>
          <div class="daily-labels">
            <span v-for="day in dailyLabels" :key="day" class="daily-label">{{ day }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth.js'

const RevenueIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` }
const OrdersIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>` }
const AvgIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` }
const ConversionIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>` }

export default {
  name: 'AnalyticsView',
  components: { RevenueIcon, OrdersIcon, AvgIcon, ConversionIcon },
  setup() {
    const { authFetch } = useAuth()
    
    const isLoading = ref(true)
    const dateRange = ref('180')
    const salesData = ref({
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      monthlySales: [],
      categoryRevenue: [],
      topProducts: [],
      orderStatusDistribution: [],
      paymentMethods: {},
      dailyRevenue: []
    })

    const paymentSegments = computed(() => {
      const methods = salesData.value.paymentMethods || {}
      const total = (methods.cod || 0) + (methods.gcash || 0)
      if (total === 0) return []

      const codPercent = (methods.cod / total) * 100
      const gcashPercent = (methods.gcash / total) * 100
      const circumference = 2 * Math.PI * 40

      return [
        {
          color: '#f59e0b',
          dashArray: `${(codPercent / 100) * circumference} ${circumference}`,
          offset: 0
        },
        {
          color: '#3b82f6',
          dashArray: `${(gcashPercent / 100) * circumference} ${circumference}`,
          offset: -(codPercent / 100) * circumference
        }
      ]
    })

    const paymentMethodsList = computed(() => {
      const methods = salesData.value.paymentMethods || {}
      const total = (methods.cod || 0) + (methods.gcash || 0)
      return [
        { name: 'cod', label: 'Cash on Delivery', count: methods.cod || 0, color: '#f59e0b', percent: total ? Math.round((methods.cod / total) * 100) : 0 },
        { name: 'gcash', label: 'GCash', count: methods.gcash || 0, color: '#3b82f6', percent: total ? Math.round((methods.gcash / total) * 100) : 0 }
      ]
    })

    const orderStatuses = computed(() => {
      const dist = salesData.value.orderStatusDistribution || []
      const total = dist.reduce((sum, s) => sum + s.count, 0)
      return dist.map(s => ({
        ...s,
        name: s._id,
        percent: total ? Math.round((s.count / total) * 100) : 0
      }))
    })

    const dailyPoints = computed(() => {
      const revenue = salesData.value.dailyRevenue || []
      if (revenue.length === 0) return []

      const maxRevenue = Math.max(...revenue.map(d => d.revenue), 1)
      const width = 700
      const height = 180
      const padding = 10

      return revenue.map((d, i) => ({
        x: padding + (i / (revenue.length - 1 || 1)) * (width - 2 * padding),
        y: height - padding - (d.revenue / maxRevenue) * (height - 2 * padding)
      }))
    })

    const linePath = computed(() => {
      const points = dailyPoints.value
      if (points.length === 0) return ''
      return points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
    })

    const areaPath = computed(() => {
      const points = dailyPoints.value
      if (points.length === 0) return ''
      const line = linePath.value
      const lastPoint = points[points.length - 1]
      const firstPoint = points[0]
      return `${line} L ${lastPoint.x},190 L ${firstPoint.x},190 Z`
    })

    const dailyLabels = computed(() => {
      const revenue = salesData.value.dailyRevenue || []
      return revenue.map(d => {
        const date = new Date(d._id)
        return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      })
    })

    const fetchAnalytics = async () => {
      isLoading.value = true
      try {
        const response = await authFetch(`http://localhost:5000/api/analytics/sales?days=${dateRange.value}`)
        if (response.ok) {
          const data = await response.json()
          salesData.value = {
            totalRevenue: data.totalRevenue || 0,
            totalOrders: data.totalOrders || 0,
            averageOrderValue: data.averageOrderValue || 0,
            conversionRate: data.conversionRate || 4.2,
            monthlySales: data.monthlySales || [],
            categoryRevenue: data.categoryRevenue || [],
            topProducts: data.topProducts || [],
            orderStatusDistribution: data.orderStatusDistribution || [],
            paymentMethods: data.paymentMethods || {},
            dailyRevenue: data.dailyRevenue || []
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
      isLoading.value = false
    }

    const formatNumber = (num) => {
      return Math.round(num).toLocaleString()
    }

    const formatShort = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    const getBarHeight = (value) => {
      const max = Math.max(...salesData.value.monthlySales.map(s => s.revenue), 1)
      return (value / max) * 100
    }

    const getCategoryPercent = (revenue) => {
      const max = Math.max(...(salesData.value.categoryRevenue || []).map(c => c.revenue), 1)
      return (revenue / max) * 100
    }

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

    onMounted(fetchAnalytics)

    return {
      isLoading, dateRange, salesData,
      paymentSegments, paymentMethodsList, orderStatuses,
      dailyPoints, linePath, areaPath, dailyLabels,
      fetchAnalytics, formatNumber, formatShort, getBarHeight, getCategoryPercent, capitalize
    }
  }
}
</script>

<style scoped>
.analytics-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-subtitle { color: #64748b; }

.date-filter select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2d5a27;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-card .stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.revenue .stat-icon { background: #dcfce7; color: #16a34a; }
.stat-card.orders .stat-icon { background: #dbeafe; color: #2563eb; }
.stat-card.average .stat-icon { background: #fef3c7; color: #f59e0b; }
.stat-card.conversion .stat-icon { background: #ede9fe; color: #8b5cf6; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

/* Charts Row */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-header {
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1rem;
  color: #1e293b;
}

.chart-container {
  height: 250px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  padding: 1rem 0;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  height: 150px;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 24px;
  background: linear-gradient(180deg, #2d5a27 0%, #4a8c42 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
  cursor: pointer;
}

.bar:hover {
  background: linear-gradient(180deg, #1e3d1a 0%, #2d5a27 100%);
}

.bar-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.bar-value {
  font-size: 0.7rem;
  color: #1e293b;
  font-weight: 600;
}

/* Pie Chart */
.pie-chart-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pie-chart {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto;
}

.pie-chart svg {
  width: 100%;
  height: 100%;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-total {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  display: block;
}

.pie-label {
  font-size: 0.75rem;
  color: #64748b;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-name {
  flex: 1;
  font-size: 0.9rem;
  color: #374151;
}

.legend-value {
  font-size: 0.85rem;
  color: #64748b;
}

/* Category Performance */
.performance-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1rem;
  color: #1e293b;
}

.category-performance {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-info {
  width: 150px;
}

.category-name {
  display: block;
  font-weight: 500;
  color: #1e293b;
  text-transform: capitalize;
}

.category-orders {
  font-size: 0.8rem;
  color: #64748b;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2d5a27, #4a8c42);
  border-radius: 4px;
  transition: width 0.3s;
}

.category-revenue {
  width: 100px;
  text-align: right;
  font-weight: 600;
  color: #1e293b;
}

/* Two Column Section */
.two-col-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.data-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  font-size: 1rem;
  color: #1e293b;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.product-row:hover {
  background: #f8fafc;
}

.rank {
  width: 24px;
  height: 24px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.product-row:nth-child(1) .rank { background: #fef3c7; color: #b45309; }
.product-row:nth-child(2) .rank { background: #e2e8f0; color: #475569; }
.product-row:nth-child(3) .rank { background: #fed7aa; color: #c2410c; }

.product-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.product-sales {
  font-size: 0.8rem;
  color: #64748b;
}

.product-revenue {
  font-weight: 600;
  color: #2d5a27;
}

/* Status List */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.pending { background: #f59e0b; }
.status-dot.processing { background: #3b82f6; }
.status-dot.shipped { background: #8b5cf6; }
.status-dot.delivered { background: #10b981; }
.status-dot.cancelled { background: #ef4444; }

.status-name {
  font-size: 0.9rem;
  color: #374151;
}

.status-bar-wrapper {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.status-bar {
  height: 100%;
  border-radius: 4px;
}

.status-bar.pending { background: #f59e0b; }
.status-bar.processing { background: #3b82f6; }
.status-bar.shipped { background: #8b5cf6; }
.status-bar.delivered { background: #10b981; }
.status-bar.cancelled { background: #ef4444; }

.status-count {
  width: 40px;
  text-align: right;
  font-weight: 600;
  color: #1e293b;
}

/* Daily Revenue */
.daily-revenue-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.daily-chart {
  margin-top: 1rem;
}

.line-chart {
  height: 200px;
}

.line-chart svg {
  width: 100%;
  height: 100%;
}

.daily-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 10px;
}

.daily-label {
  font-size: 0.7rem;
  color: #64748b;
}

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .two-col-section { grid-template-columns: 1fr; }
}
</style>
