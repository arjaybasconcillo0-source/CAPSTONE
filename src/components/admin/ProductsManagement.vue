<template>
  <div class="products-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <p class="header-subtitle">{{ products.length }} total products</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <PlusIcon /> Add Product
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <SearchIcon />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search products..."
          @input="filterProducts"
        />
      </div>
      <select v-model="categoryFilter" @change="filterProducts" class="filter-select">
        <option value="">All Categories</option>
        <option value="bags">Bags</option>
        <option value="shoulder-bags">Shoulder Bags</option>
        <option value="baskets">Baskets (Legacy)</option>
        <option value="home-decor">Home Decor</option>
        <option value="wallets">Wallets</option>
        <option value="hats">Hats</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- Products Table -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="6" class="empty-products">
              {{ searchQuery || categoryFilter ? 'No matching products.' : 'No products added yet. Add your first product.' }}
            </td>
          </tr>
          <tr v-for="product in filteredProducts" :key="product._id">
            <td>
              <div class="product-cell">
                <img :src="product.images[0]" :alt="product.name" class="product-thumb" />
                <div class="product-info">
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="category-badge">{{ product.category }}</span>
            </td>
            <td class="price-cell">₱{{ product.price.toLocaleString() }}</td>
            <td>
              <span class="stock-badge" :class="getStockClass(product.stock)">
                {{ product.stock }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="product.stock > 0 ? 'active' : 'inactive'">
                {{ product.stock > 0 ? 'Active' : 'Out of Stock' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="editProduct(product)" class="btn-icon edit">
                  <EditIcon />
                </button>
                <button @click="confirmDelete(product)" class="btn-icon delete">
                  <DeleteIcon />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Product' : 'Add New Product' }}</h2>
          <button @click="closeModals" class="btn-close">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="product-form">
          <div class="form-grid">
            <div class="form-group full">
              <label>Product Name *</label>
              <input type="text" v-model="formData.name" required />
            </div>

            <div class="form-group">
              <label>Price (₱) *</label>
              <input type="number" v-model="formData.price" required min="0" />
            </div>

            <div class="form-group">
              <label>Stock *</label>
              <input type="number" v-model="formData.stock" required min="0" />
            </div>

            <div class="form-group full">
              <label>Category *</label>
              <select v-model="formData.category" required>
                <option value="">Select category</option>
                <option value="bags">Bags</option>
                <option value="shoulder-bags">Shoulder Bags</option>
                <option value="baskets">Baskets (Legacy)</option>
                <option value="home-decor">Home Decor</option>
                <option value="wallets">Wallets</option>
                <option value="hats">Hats</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Full Description *</label>
              <textarea v-model="formData.description" required rows="4"></textarea>
            </div>

            <div class="form-group full">
              <label>Image URLs (one per line)</label>
              <textarea v-model="imagesText" rows="3" placeholder="https://example.com/image.jpg"></textarea>
            </div>

            <div class="form-group full">
              <label>Materials (comma separated)</label>
              <input type="text" v-model="materialsText" placeholder="Water lily fiber, Cotton" />
            </div>

            <div class="form-group full">
              <label>Tags (comma separated)</label>
              <input type="text" v-model="tagsText" placeholder="eco-friendly, handmade, best-seller" />
            </div>
          </div>

          <div v-if="formError" class="error-message">{{ formError }}</div>

          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="btn-primary">
              {{ isSubmitting ? 'Saving...' : (showEditModal ? 'Update' : 'Add Product') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Delete Product</h2>
          <button @click="showDeleteModal = false" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "<strong>{{ productToDelete?.name }}</strong>"?</p>
          <p class="warning">This action cannot be undone.</p>
        </div>
        <div class="form-actions">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="handleDelete" :disabled="isDeleting" class="btn-danger">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useProducts } from '../../composables/useProducts.js'

const PlusIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` }
const SearchIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` }
const EditIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` }
const DeleteIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>` }

export default {
  name: 'ProductsManagement',
  components: { PlusIcon, SearchIcon, EditIcon, DeleteIcon },
  setup() {
    const { products, isLoading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()

    const filteredProducts = ref([])
    const searchQuery = ref('')
    const categoryFilter = ref('')
    
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const isSubmitting = ref(false)
    const isDeleting = ref(false)
    const formError = ref('')
    const editingProductId = ref(null)
    const productToDelete = ref(null)

    const formData = reactive({
      name: '', price: 0, category: '', description: '', stock: 0
    })
    const imagesText = ref('')
    const materialsText = ref('')
    const tagsText = ref('')

    const filterProducts = () => {
      let result = [...products.value]
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        )
      }
      if (categoryFilter.value) {
        result = result.filter(p => p.category === categoryFilter.value)
      }
      filteredProducts.value = result
    }

    const getStockClass = (stock) => {
      if (stock === 0) return 'out'
      if (stock < 10) return 'low'
      return 'good'
    }

    const resetForm = () => {
      formData.name = ''
      formData.price = 0
      formData.category = ''
      formData.description = ''
      formData.stock = 0
      imagesText.value = ''
      materialsText.value = ''
      tagsText.value = ''
      formError.value = ''
      editingProductId.value = null
    }

    const closeModals = () => {
      showAddModal.value = false
      showEditModal.value = false
      showDeleteModal.value = false
      resetForm()
    }

    const editProduct = (product) => {
      editingProductId.value = product._id
      formData.name = product.name
      formData.price = product.price
      formData.category = product.category
      formData.description = product.description
      formData.stock = product.stock
      imagesText.value = (product.images || []).join('\n')
      materialsText.value = (product.materials || []).join(', ')
      tagsText.value = (product.tags || []).join(', ')
      showEditModal.value = true
    }

    const confirmDelete = (product) => {
      productToDelete.value = product
      showDeleteModal.value = true
    }

    const handleSubmit = async () => {
      formError.value = ''
      isSubmitting.value = true

      const productData = {
        ...formData,
        images: imagesText.value.split('\n').map(s => s.trim()).filter(Boolean),
        materials: materialsText.value.split(',').map(s => s.trim()).filter(Boolean),
        tags: tagsText.value.split(',').map(s => s.trim()).filter(Boolean)
      }

      let result
      if (showEditModal.value && editingProductId.value) {
        result = await updateProduct(editingProductId.value, productData)
      } else {
        result = await createProduct(productData)
      }

      isSubmitting.value = false

      if (result.success) {
        closeModals()
        await fetchProducts()
        filterProducts()
      } else {
        formError.value = result.error
      }
    }

    const handleDelete = async () => {
      if (!productToDelete.value) return
      isDeleting.value = true
      const result = await deleteProduct(productToDelete.value._id)
      isDeleting.value = false

      if (result.success) {
        showDeleteModal.value = false
        productToDelete.value = null
        filterProducts()
      }
    }

    onMounted(async () => {
      await fetchProducts()
      filterProducts()
    })

    return {
      products, filteredProducts, isLoading, searchQuery, categoryFilter,
      showAddModal, showEditModal, showDeleteModal, isSubmitting, isDeleting,
      formData, imagesText, materialsText, tagsText, formError, productToDelete,
      filterProducts, getStockClass, closeModals, editProduct, confirmDelete, handleSubmit, handleDelete
    }
  }
}
</script>

<style scoped>
.products-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-subtitle {
  color: #64748b;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2d5a27;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #1e3d1a; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.filters-bar {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.95rem;
}

.filter-select {
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

.data-table td.empty-products {
  padding: 2rem;
  color: #64748b;
  text-align: center;
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
  gap: 1rem;
}

.product-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
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

.price-cell {
  font-weight: 600;
  color: #1e293b;
}

.stock-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.stock-badge.good { background: #dcfce7; color: #166534; }
.stock-badge.low { background: #fef3c7; color: #92400e; }
.stock-badge.out { background: #fee2e2; color: #991b1b; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #fee2e2; color: #991b1b; }

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

.btn-icon.edit { background: #dbeafe; color: #2563eb; }
.btn-icon.edit:hover { background: #bfdbfe; }
.btn-icon.delete { background: #fee2e2; color: #dc2626; }
.btn-icon.delete:hover { background: #fecaca; }

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 600px;
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

.modal-body .warning {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.product-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full { grid-column: span 2; }

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2d5a27;
  box-shadow: 0 0 0 3px rgba(45,90,39,0.1);
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

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

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.6; }
</style>
