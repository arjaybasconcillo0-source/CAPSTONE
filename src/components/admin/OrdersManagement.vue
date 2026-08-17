<template>
  <div class="orders-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <p class="header-subtitle">{{ orders.length }} total orders</p>
      </div>
      <div class="filters">
        <select v-model="statusFilter" @change="filterOrders" class="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card pending">
        <span class="stat-value">{{ statusCounts.pending }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-card processing">
        <span class="stat-value">{{ statusCounts.processing }}</span>
        <span class="stat-label">Processing</span>
      </div>
      <div class="stat-card shipped">
        <span class="stat-value">{{ statusCounts.shipped }}</span>
        <span class="stat-label">Shipped</span>
      </div>
      <div class="stat-card delivered">
        <span class="stat-value">{{ statusCounts.delivered }}</span>
        <span class="stat-label">Delivered</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- Orders Table -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order._id">
            <td class="order-id">#{{ order.orderNumber }}</td>
            <td>
              <div class="customer-cell">
                <span class="customer-name">{{ order.shippingAddress?.fullName }}</span>
                <span class="customer-email">{{ order.user?.email }}</span>
              </div>
            </td>
            <td class="items-count">{{ order.items?.length }} items</td>
            <td class="total-cell">₱{{ order.totalAmount?.toLocaleString() }}</td>
            <td>
              <span class="payment-badge" :class="order.paymentMethod">
                {{ order.paymentMethod === 'cod' ? 'COD' : 'GCash' }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="order.status">
                {{ capitalizeFirst(order.status) }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="viewOrder(order)" class="btn-icon view">
                  <EyeIcon />
                </button>
                <button @click="showUpdateStatus(order)" class="btn-icon edit">
                  <EditIcon />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Order #{{ selectedOrder?.orderNumber }}</h2>
          <button @click="showDetailsModal = false" class="btn-close">&times;</button>
        </div>

        <div class="order-details">
          <!-- Order Info -->
          <div class="detail-section">
            <h3>Order Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="status-badge" :class="selectedOrder?.status">
                  {{ capitalizeFirst(selectedOrder?.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Method</span>
                <span>{{ selectedOrder?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'GCash' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Status</span>
                <span class="payment-status" :class="selectedOrder?.isPaid ? 'paid' : 'unpaid'">
                  {{ selectedOrder?.isPaid ? 'Paid' : 'Unpaid' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Date</span>
                <span>{{ formatDate(selectedOrder?.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="detail-section">
            <h3>Shipping Address</h3>
            <div class="address-box">
              <p class="address-name">{{ selectedOrder?.shippingAddress?.fullName }}</p>
              <p>{{ selectedOrder?.shippingAddress?.phone }}</p>
              <p>{{ selectedOrder?.shippingAddress?.address }}</p>
              <p>{{ selectedOrder?.shippingAddress?.city }}, {{ selectedOrder?.shippingAddress?.postalCode }}</p>
            </div>
          </div>

          <!-- Order Items -->
          <div class="detail-section">
            <h3>Order Items</h3>
            <div class="items-list">
              <div v-for="item in selectedOrder?.items" :key="item._id" class="order-item">
                <img :src="item.product?.images?.[0]" :alt="item.product?.name" class="item-image" />
                <div class="item-info">
                  <span class="item-name">{{ item.product?.name }}</span>
                  <span class="item-qty">Qty: {{ item.quantity }}</span>
                </div>
                <span class="item-price">₱{{ (item.price * item.quantity).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="detail-section">
            <h3>Order Summary</h3>
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₱{{ selectedOrder?.totalAmount?.toLocaleString() }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>₱0</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>₱{{ selectedOrder?.totalAmount?.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Update Order Status</h2>
          <button @click="showStatusModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Order #{{ selectedOrder?.orderNumber }}</p>
          <div class="form-group">
            <label>Status</label>
            <select v-model="newStatus" class="status-select">
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button @click="showStatusModal = false" class="btn-secondary">Cancel</button>
          <button @click="updateOrderStatus" :disabled="isUpdating" class="btn-primary">
            {{ isUpdating ? 'Updating...' : 'Update Status' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth.js'

const EyeIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>` }
const EditIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` }

export default {
  name: 'OrdersManagement',
  components: { EyeIcon, EditIcon },
  setup() {
    const { authFetch } = useAuth()
    
    const orders = ref([])
    const filteredOrders = ref([])
    const isLoading = ref(true)
    const statusFilter = ref('')
    
    const showDetailsModal = ref(false)
    const showStatusModal = ref(false)
    const selectedOrder = ref(null)
    const newStatus = ref('')
    const isUpdating = ref(false)

    const statusCounts = computed(() => {
      const counts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
      orders.value.forEach(order => {
        if (counts[order.status] !== undefined) counts[order.status]++
      })
      return counts
    })

    const fetchOrders = async () => {
      isLoading.value = true
      try {
        const response = await authFetch('http://localhost:5000/api/orders')
        if (response.ok) {
          const data = await response.json()
          orders.value = data
          filterOrders()
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      }
      isLoading.value = false
    }

    const filterOrders = () => {
      if (statusFilter.value) {
        filteredOrders.value = orders.value.filter(o => o.status === statusFilter.value)
      } else {
        filteredOrders.value = [...orders.value]
      }
    }

    const capitalizeFirst = (str) => {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const viewOrder = (order) => {
      selectedOrder.value = order
      showDetailsModal.value = true
    }

    const showUpdateStatus = (order) => {
      selectedOrder.value = order
      newStatus.value = order.status
      showStatusModal.value = true
    }

    const updateOrderStatus = async () => {
      if (!selectedOrder.value || !newStatus.value) return
      isUpdating.value = true

      try {
        const response = await authFetch(`http://localhost:5000/api/orders/${selectedOrder.value._id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus.value })
        })

        if (response.ok) {
          const updatedOrder = await response.json()
          const index = orders.value.findIndex(o => o._id === updatedOrder._id)
          if (index !== -1) {
            orders.value[index] = updatedOrder
            filterOrders()
          }
          showStatusModal.value = false
        }
      } catch (error) {
        console.error('Error updating order:', error)
      }
      isUpdating.value = false
    }

    onMounted(fetchOrders)

    return {
      orders, filteredOrders, isLoading, statusFilter, statusCounts,
      showDetailsModal, showStatusModal, selectedOrder, newStatus, isUpdating,
      filterOrders, capitalizeFirst, formatDate, viewOrder, showUpdateStatus, updateOrderStatus
    }
  }
}
</script>

<style scoped>
.orders-management {
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

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}

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
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid;
}

.stat-card.pending { border-color: #f59e0b; }
.stat-card.processing { border-color: #3b82f6; }
.stat-card.shipped { border-color: #8b5cf6; }
.stat-card.delivered { border-color: #10b981; }

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
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

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.order-id {
  font-weight: 600;
  color: #2d5a27;
}

.customer-cell {
  display: flex;
  flex-direction: column;
}

.customer-name { font-weight: 500; }
.customer-email { font-size: 0.8rem; color: #64748b; }

.items-count { color: #64748b; }

.total-cell {
  font-weight: 600;
  color: #1e293b;
}

.payment-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.payment-badge.cod { background: #fef3c7; color: #92400e; }
.payment-badge.gcash { background: #dbeafe; color: #1d4ed8; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.processing { background: #dbeafe; color: #1d4ed8; }
.status-badge.shipped { background: #ede9fe; color: #6d28d9; }
.status-badge.delivered { background: #dcfce7; color: #166534; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }

.date-cell {
  font-size: 0.9rem;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.view { background: #f0fdf4; color: #16a34a; }
.btn-icon.view:hover { background: #dcfce7; }
.btn-icon.edit { background: #dbeafe; color: #2563eb; }
.btn-icon.edit:hover { background: #bfdbfe; }

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small { max-width: 400px; }
.modal-large { max-width: 700px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: #1e293b;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.modal-body {
  padding: 1.5rem;
}

.order-details {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1rem;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8rem;
  color: #64748b;
}

.payment-status {
  font-weight: 500;
}

.payment-status.paid { color: #16a34a; }
.payment-status.unpaid { color: #dc2626; }

.address-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.address-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name { font-weight: 500; }
.item-qty { font-size: 0.85rem; color: #64748b; }

.item-price {
  font-weight: 600;
  color: #1e293b;
}

.summary-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.summary-row.total {
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-weight: 700;
  font-size: 1.1rem;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.status-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-primary {
  background: #2d5a27;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover { background: #1e3d1a; }
.btn-primary:disabled { opacity: 0.6; }

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover { background: #e2e8f0; }
</style>
