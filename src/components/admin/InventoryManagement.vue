<template>
  <div class="inventory-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <p class="header-subtitle">Monitor stock levels and inventory health</p>
      </div>
      <button @click="fetchInventory" class="btn-secondary">
        <RefreshIcon /> Refresh
      </button>
    </div>

    <div v-if="inventoryError" class="error-state" role="alert">
      <span>{{ inventoryError }}</span>
      <button type="button" @click="fetchInventory">Try again</button>
    </div>

    <!-- Quick Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <PackageIcon />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.totalProducts }}</span>
          <span class="stat-label">Total Products</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stock">
          <InventoryIcon />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.totalStock }}</span>
          <span class="stat-label">Total Stock</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon low">
          <AlertIcon />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.lowStock }}</span>
          <span class="stat-label">Low Stock</span>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon out">
          <EmptyIcon />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.outOfStock }}</span>
          <span class="stat-label">Out of Stock</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- Low Stock Alerts -->
      <div v-if="lowStockProducts.length > 0" class="alerts-section">
        <div class="section-header">
          <h2><AlertIcon /> Low Stock Alerts</h2>
        </div>
        <div class="alerts-grid">
          <div v-for="product in lowStockProducts" :key="product._id" class="alert-card">
            <img :src="product.images[0]" :alt="product.name" class="alert-image" />
            <div class="alert-info">
              <span class="alert-name">{{ product.name }}</span>
              <span class="alert-category">{{ product.category }}</span>
            </div>
            <div class="alert-stock">
              <span class="stock-number" :class="product.stock === 0 ? 'out' : 'low'">
                {{ product.stock }}
              </span>
              <span class="stock-label">in stock</span>
            </div>
            <button @click="openStockModal(product)" class="btn-update">
              Update Stock
            </button>
          </div>
        </div>
      </div>

      <!-- Inventory by Category -->
      <div class="category-section">
        <div class="section-header">
          <h2>Inventory by Category</h2>
        </div>
        <div class="category-grid">
          <div v-for="cat in categoryStats" :key="cat.category" class="category-card">
            <div class="category-header">
              <h3>{{ cat.category }}</h3>
              <span class="category-count">{{ cat.productCount }} products</span>
            </div>
            <div class="category-stats">
              <div class="cat-stat">
                <span class="cat-value">{{ cat.totalStock }}</span>
                <span class="cat-label">Total Stock</span>
              </div>
              <div class="cat-stat">
                <span class="cat-value">₱{{ cat.totalValue.toLocaleString() }}</span>
                <span class="cat-label">Inventory Value</span>
              </div>
              <div class="cat-stat">
                <span class="cat-value">₱{{ Math.round(cat.avgPrice).toLocaleString() }}</span>
                <span class="cat-label">Avg Price</span>
              </div>
            </div>
            <div class="stock-bar">
              <div class="stock-fill" :style="{ width: getStockPercent(cat) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Inventory Table -->
      <div class="inventory-table-section">
        <div class="section-header">
          <h2>All Products</h2>
          <div class="table-filters">
            <select v-model="tableFilter" @change="filterTable">
              <option value="all">All Products</option>
              <option value="low">Low Stock (< 10)</option>
              <option value="out">Out of Stock</option>
              <option value="good">Good Stock</option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in filteredTable" :key="product._id">
                <td>
                  <div class="product-cell">
                    <img :src="product.images[0]" :alt="product.name" class="product-thumb" />
                    <span class="product-name">{{ product.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="category-badge">{{ product.category }}</span>
                </td>
                <td>₱{{ product.price.toLocaleString() }}</td>
                <td>
                  <span class="stock-badge" :class="getStockClass(product.stock)">
                    {{ product.stock }}
                  </span>
                </td>
                <td>₱{{ (product.price * product.stock).toLocaleString() }}</td>
                <td>
                  <span class="status-indicator" :class="getStockClass(product.stock)">
                    {{ getStatusText(product.stock) }}
                  </span>
                </td>
                <td>
                  <button @click="openStockModal(product)" class="btn-icon">
                    <EditIcon />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Update Stock Modal -->
    <div v-if="showStockModal" class="modal-overlay" @click.self="showStockModal = false">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Update Stock</h2>
          <button @click="showStockModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="stock-product-info">
            <img :src="selectedProduct?.images[0]" :alt="selectedProduct?.name" class="modal-thumb" />
            <div>
              <p class="modal-product-name">{{ selectedProduct?.name }}</p>
              <p class="modal-product-cat">{{ selectedProduct?.category }}</p>
            </div>
          </div>
          <div class="form-group">
            <label>Current Stock: <strong>{{ selectedProduct?.stock }}</strong></label>
          </div>
          <div class="form-group">
            <label>New Stock Quantity</label>
            <input type="number" v-model.number="newStock" min="0" class="stock-input" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="showStockModal = false" class="btn-secondary">Cancel</button>
          <button @click="updateStock" :disabled="isUpdating" class="btn-primary">
            {{ isUpdating ? 'Updating...' : 'Update Stock' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth.js'
import { useProducts } from '../../composables/useProducts.js'

const RefreshIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>` }
const PackageIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/></svg>` }
const InventoryIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>` }
const AlertIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` }
const EmptyIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>` }
const EditIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` }

export default {
  name: 'InventoryManagement',
  components: { RefreshIcon, PackageIcon, InventoryIcon, AlertIcon, EmptyIcon, EditIcon },
  setup() {
    const { authFetch } = useAuth()
    const { products, updateProduct } = useProducts()

    const isLoading = ref(true)
    const inventoryError = ref('')
    const categoryStats = ref([])
    const tableFilter = ref('all')
    const filteredTable = ref([])

    const showStockModal = ref(false)
    const selectedProduct = ref(null)
    const newStock = ref(0)
    const isUpdating = ref(false)

    const stats = computed(() => {
      const prods = products.value || []
      return {
        totalProducts: prods.length,
        totalStock: prods.reduce((sum, p) => sum + p.stock, 0),
        lowStock: prods.filter(p => p.stock > 0 && p.stock < 10).length,
        outOfStock: prods.filter(p => p.stock === 0).length
      }
    })

    const lowStockProducts = computed(() => {
      return (products.value || [])
        .filter(p => p.stock < 10)
        .sort((a, b) => a.stock - b.stock)
    })

    const fetchInventory = async () => {
      isLoading.value = true
      inventoryError.value = ''
      try {
        const data = await authFetch('/analytics/inventory')
        products.value = data.products || []
        categoryStats.value = (data.inventoryByCategory || []).map(category => ({
          category: category._id,
          productCount: category.totalProducts,
          totalStock: category.totalStock,
          totalValue: category.totalValue || 0,
          avgPrice: category.avgPrice || 0
        }))
        filterTable()
      } catch (error) {
        console.error('Error fetching inventory:', error)
        inventoryError.value = 'Inventory data could not be loaded. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const filterTable = () => {
      const prods = products.value || []
      switch (tableFilter.value) {
        case 'low':
          filteredTable.value = prods.filter(p => p.stock > 0 && p.stock < 10)
          break
        case 'out':
          filteredTable.value = prods.filter(p => p.stock === 0)
          break
        case 'good':
          filteredTable.value = prods.filter(p => p.stock >= 10)
          break
        default:
          filteredTable.value = [...prods]
      }
    }

    const getStockClass = (stock) => {
      if (stock === 0) return 'out'
      if (stock < 10) return 'low'
      return 'good'
    }

    const getStatusText = (stock) => {
      if (stock === 0) return 'Out of Stock'
      if (stock < 10) return 'Low Stock'
      return 'In Stock'
    }

    const getStockPercent = (cat) => {
      const maxStock = Math.max(...categoryStats.value.map(c => c.totalStock))
      return maxStock > 0 ? (cat.totalStock / maxStock) * 100 : 0
    }

    const openStockModal = (product) => {
      selectedProduct.value = product
      newStock.value = product.stock
      showStockModal.value = true
    }

    const updateStock = async () => {
      if (!selectedProduct.value) return
      isUpdating.value = true

      const result = await updateProduct(selectedProduct.value._id, {
        stock: newStock.value
      })

      if (result.success) {
        showStockModal.value = false
        await fetchInventory()
      }
      isUpdating.value = false
    }

    onMounted(fetchInventory)

    return {
      isLoading, inventoryError, stats, categoryStats, lowStockProducts,
      tableFilter, filteredTable,
      showStockModal, selectedProduct, newStock, isUpdating,
      fetchInventory, filterTable, getStockClass, getStatusText, getStockPercent,
      openStockModal, updateStock
    }
  }
}
</script>

<style scoped>
.inventory-management {
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

.error-state {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
}

.error-state button {
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 6px;
  background: #991b1b;
  color: #fff;
  cursor: pointer;
}
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover { background: #e2e8f0; }

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

.stat-card.warning { border-left: 4px solid #f59e0b; }
.stat-card.danger { border-left: 4px solid #dc2626; }

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.total { background: #dbeafe; color: #2563eb; }
.stat-icon.stock { background: #dcfce7; color: #16a34a; }
.stat-icon.low { background: #fef3c7; color: #f59e0b; }
.stat-icon.out { background: #fee2e2; color: #dc2626; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
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

/* Alerts Section */
.alerts-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: #1e293b;
}

.alerts-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
}

.alert-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

.alert-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.alert-name { font-weight: 600; color: #1e293b; }
.alert-category { font-size: 0.85rem; color: #64748b; text-transform: capitalize; }

.alert-stock {
  text-align: center;
}

.stock-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stock-number.low { color: #f59e0b; }
.stock-number.out { color: #dc2626; }

.stock-label {
  font-size: 0.75rem;
  color: #64748b;
}

.btn-update {
  background: #2d5a27;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-update:hover { background: #1e3d1a; }

/* Category Section */
.category-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.category-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-header h3 {
  font-size: 1rem;
  color: #1e293b;
  text-transform: capitalize;
}

.category-count {
  font-size: 0.8rem;
  color: #64748b;
}

.category-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.cat-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cat-value {
  font-weight: 600;
  color: #1e293b;
}

.cat-label {
  font-size: 0.7rem;
  color: #64748b;
}

.stock-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  background: #2d5a27;
  border-radius: 3px;
  transition: width 0.3s;
}

/* Inventory Table */
.inventory-table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.table-filters select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
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

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
}

.category-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.stock-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-badge.good { background: #dcfce7; color: #166534; }
.stock-badge.low { background: #fef3c7; color: #92400e; }
.stock-badge.out { background: #fee2e2; color: #991b1b; }

.status-indicator {
  font-size: 0.85rem;
  font-weight: 500;
}

.status-indicator.good { color: #16a34a; }
.status-indicator.low { color: #f59e0b; }
.status-indicator.out { color: #dc2626; }

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: #dbeafe;
  color: #2563eb;
  cursor: pointer;
}

.btn-icon:hover { background: #bfdbfe; }

/* Modal */
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

.stock-product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.modal-product-name {
  font-weight: 600;
  color: #1e293b;
}

.modal-product-cat {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: capitalize;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.stock-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.stock-input:focus {
  outline: none;
  border-color: #2d5a27;
  box-shadow: 0 0 0 3px rgba(45,90,39,0.1);
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
</style>
