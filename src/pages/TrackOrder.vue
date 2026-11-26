<template>
  <section class="track-order-page">
    <header class="tracking-hero">
      <div class="container">
        <p class="eyebrow">Thoughtfully made. Carefully delivered.</p>
        <h1>Your orders,<br><span>every step of the way.</span></h1>
        <p>Every Water Lily purchase, together in one place. Select an order to follow its journey.</p>
      </div>
    </header>

    <main class="container orders-container">
      <header class="orders-heading">
        <div>
          <p class="eyebrow">Your Water Lily purchases</p>
          <h2>My orders <span v-if="orders.length" class="order-count">{{ orders.length }}</span></h2>
        </div>
        <button class="refresh-button" type="button" :disabled="isLoading" @click="loadOrders">
          <span aria-hidden="true">↻</span>
          {{ isLoading ? 'Updating…' : 'Refresh updates' }}
        </button>
      </header>

      <div v-if="isLoading && !orders.length" class="empty-state" role="status">
        <span class="loading-spinner"></span>
        <p>Loading your orders…</p>
      </div>

      <p v-if="errorMessage" class="page-message error-message" role="alert">{{ errorMessage }}</p>

      <div v-if="!isLoading && !orders.length" class="empty-state">
        <span class="empty-icon" aria-hidden="true">📦</span>
        <h2>Your orders will appear here</h2>
        <p>Once you place an order, you can follow its progress here—no order search needed.</p>
        <router-link to="/shop" class="shop-button">Explore the shop <span aria-hidden="true">→</span></router-link>
      </div>

      <div v-else-if="orders.length" class="orders-layout">
        <div class="order-list" aria-label="Your orders">
          <article v-for="order in orders" :key="order.orderNumber" class="order-card">
            <button
              type="button"
              class="order-card-button"
              :class="{ selected: selectedOrder?.orderNumber === order.orderNumber }"
              :aria-expanded="selectedOrder?.orderNumber === order.orderNumber"
              @click="selectOrder(order)"
            >
              <img
                v-if="order.items?.[0]?.image"
                :src="order.items[0].image"
                :alt="order.items[0].name"
                class="order-thumbnail"
              >
              <span v-else class="order-thumbnail image-placeholder" aria-hidden="true">🪷</span>
              <span class="order-card-content">
                <span class="order-card-top">
                  <strong>{{ order.items?.[0]?.name || 'Water Lily order' }}</strong>
                  <span class="status-pill" :class="order.orderStatus">
                    <span class="status-dot"></span>
                    {{ statusLabel(order.orderStatus) }}
                  </span>
                </span>
                <span class="order-card-meta">{{ order.orderNumber }} · {{ formatDate(order.createdAt) }}</span>
                <span class="order-card-bottom">
                  <span>
                    {{ order.items?.length || 0 }} {{ order.items?.length === 1 ? 'item' : 'items' }}
                    <template v-if="order.items?.length > 1"> · {{ order.items.slice(1).map(item => item.name).join(', ') }}</template>
                  </span>
                  <strong>{{ formatCurrency(order.totalAmount) }}</strong>
                </span>
              </span>
              <span class="order-chevron" aria-hidden="true">›</span>
            </button>
            <p v-if="order.loadError" class="order-load-error">{{ order.loadError }}</p>
          </article>
        </div>

        <article v-if="selectedOrder" class="tracking-result" aria-live="polite">
          <header class="order-header">
            <div>
              <p class="eyebrow">A little update for you</p>
              <h2>Hello, {{ firstName }} <span aria-hidden="true">👋</span></h2>
              <p class="order-meta">Order <strong>{{ selectedOrder.orderNumber }}</strong> · Placed {{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
            <span class="status-pill" :class="selectedOrder.orderStatus">
              <span class="status-dot"></span>
              {{ statusLabel(selectedOrder.orderStatus) }}
            </span>
          </header>

          <section class="journey-card" aria-label="Order progress">
            <div class="journey-heading">
              <div>
                <h3>{{ currentStatus.title }}</h3>
                <p>{{ currentStatus.description }}</p>
              </div>
              <span class="updated-label">Updated {{ formatDate(selectedOrder.updatedAt || selectedOrder.createdAt) }}</span>
            </div>

            <p v-if="selectedOrder.orderStatus === 'cancelled'" class="cancelled-message">
              This order was cancelled. Please contact our team if you need help.
            </p>
            <ol v-else class="status-timeline">
              <li
                v-for="(step, index) in statusSteps"
                :key="step.id"
                :class="{ complete: selectedStatusIndex >= index, current: selectedStatusIndex === index }"
              >
                <span class="timeline-marker">{{ selectedStatusIndex > index ? '✓' : index + 1 }}</span>
                <span class="timeline-title">{{ step.title }}</span>
                <span class="timeline-description">{{ step.shortDescription }}</span>
              </li>
            </ol>
          </section>

          <div class="order-columns">
            <section class="items-card">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">Made for you</p>
                  <h3>In this order</h3>
                </div>
                <span>{{ selectedOrder.items.length }} {{ selectedOrder.items.length === 1 ? 'item' : 'items' }}</span>
              </div>
              <ul class="items-list">
                <li v-for="(item, index) in selectedOrder.items" :key="`${item.name}-${index}`" class="order-item">
                  <img v-if="item.image" :src="item.image" :alt="item.name" class="item-image">
                  <span v-else class="item-image image-placeholder" aria-hidden="true">🪷</span>
                  <span class="item-info">
                    <strong>{{ item.name }}</strong>
                    <span v-if="item.variantSize || item.variantColor" class="item-variant">
                      {{ [item.variantSize, item.variantColor].filter(Boolean).join(' · ') }}
                    </span>
                    <span>Qty: {{ item.quantity }}</span>
                  </span>
                  <strong class="item-price">{{ formatCurrency(item.price * item.quantity) }}</strong>
                </li>
              </ul>
            </section>

            <aside class="delivery-card">
              <p class="eyebrow">The finishing touches</p>
              <h3>Delivery & payment</h3>
              <div class="detail-row">
                <span class="detail-icon" aria-hidden="true">⌖</span>
                <div>
                  <strong>Delivering to</strong>
                  <p>{{ selectedOrder.shippingAddress.city }}, {{ selectedOrder.shippingAddress.province }}</p>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-icon" aria-hidden="true">₱</span>
                <div>
                  <strong>Payment</strong>
                  <p>{{ statusLabel(selectedOrder.paymentStatus) }}</p>
                </div>
              </div>
              <div class="price-summary">
                <div><span>Subtotal</span><span>{{ formatCurrency(selectedOrder.subtotal) }}</span></div>
                <div><span>Delivery</span><span>{{ selectedOrder.shippingFee ? formatCurrency(selectedOrder.shippingFee) : 'Free' }}</span></div>
                <div class="total-row"><strong>Order total</strong><strong>{{ formatCurrency(selectedOrder.totalAmount) }}</strong></div>
              </div>
            </aside>
          </div>

          <section
            v-if="selectedOrder.orderStatus === 'delivered'"
            class="feedback-card"
            aria-labelledby="order-feedback-title"
          >
            <div class="feedback-heading">
              <p class="eyebrow">Your experience matters</p>
              <h3 id="order-feedback-title">Rate and review your order</h3>
              <p>Share feedback on the items you received. You can update your review later.</p>
            </div>

            <article
              v-for="item in reviewItems"
              :key="item.productId"
              class="feedback-item"
            >
              <div class="feedback-item-heading">
                <img v-if="item.image" :src="item.image" :alt="item.name" class="feedback-image">
                <span v-else class="feedback-image image-placeholder" aria-hidden="true">🪷</span>
                <h4>{{ item.name }}</h4>
              </div>

              <p v-if="getReviewState(item.productId).loading" class="feedback-message">
                Loading your review…
              </p>
              <div v-else-if="getReviewState(item.productId).review" class="feedback-submitted">
                <p class="feedback-message success">
                  Your review has been submitted and cannot be changed.
                </p>
                <RatingStars :rating="getReviewState(item.productId).rating" :size="20" />
                <p>{{ getReviewState(item.productId).comment }}</p>
              </div>
              <form v-else class="feedback-form" @submit.prevent="submitOrderReview(item.productId)">
                <label class="feedback-label">Your rating</label>
                <RatingStars
                  :rating="getReviewState(item.productId).rating"
                  :size="24"
                  interactive
                  @rate="setReviewRating(item.productId, $event)"
                />

                <label class="feedback-label" :for="`order-review-${item.productId}`">Your review</label>
                <textarea
                  :id="`order-review-${item.productId}`"
                  :value="getReviewState(item.productId).comment"
                  rows="4"
                  maxlength="2000"
                  placeholder="What did you think of this item?"
                  required
                  @input="setReviewComment(item.productId, $event.target.value)"
                ></textarea>

                <p v-if="getReviewState(item.productId).error" class="feedback-message error" role="alert">
                  {{ getReviewState(item.productId).error }}
                </p>
                <p v-if="getReviewState(item.productId).success" class="feedback-message success" role="status">
                  {{ getReviewState(item.productId).success }}
                </p>

                <button
                  type="submit"
                  class="feedback-submit"
                  :disabled="getReviewState(item.productId).saving || !getReviewState(item.productId).rating || !getReviewState(item.productId).comment.trim()"
                >
                  {{ getReviewState(item.productId).saving ? 'Saving…' : 'Submit review' }}
                </button>
              </form>
            </article>
          </section>
        </article>
      </div>
    </main>
  </section>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RatingStars from '../components/RatingStars.vue'
import { useAuth } from '../composables/useAuth.js'

const TRACKED_ORDERS_KEY = 'waterlily-tracked-orders'
const statusSteps = [
  { id: 'pending', title: 'Order placed', shortDescription: 'Received', description: 'We’ve received your order and will start preparing it soon.' },
  { id: 'confirmed', title: 'Confirmed', shortDescription: 'Confirmed', description: 'Your order has been confirmed by our team.' },
  { id: 'processing', title: 'Preparing', shortDescription: 'Preparing', description: 'Our team is carefully preparing your handcrafted items.' },
  { id: 'shipped', title: 'On the way', shortDescription: 'Shipped', description: 'Your order is on its way to you.' },
  { id: 'delivered', title: 'Delivered', shortDescription: 'Delivered', description: 'Your order has arrived. We hope you love it!' }
]

export default {
  name: 'TrackOrder',
  components: {
    RatingStars
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { authFetch, isAuthenticated, user } = useAuth()
    const orders = ref([])
    const selectedOrder = ref(null)
    const isLoading = ref(false)
    const errorMessage = ref('')
    const reviewStates = ref({})
    let latestLoad = 0
    const selectedStatusIndex = computed(() => statusSteps.findIndex((step) => step.id === selectedOrder.value?.orderStatus))
    const firstName = computed(() => selectedOrder.value?.customerName?.trim().split(/\s+/)[0] || 'there')
    const reviewItems = computed(() => {
      if (selectedOrder.value?.orderStatus !== 'delivered') return []

      const uniqueItems = new Map()
      for (const item of selectedOrder.value.items || []) {
        const productId = typeof item.product === 'string'
          ? item.product
          : item.product?._id
        if (!productId || uniqueItems.has(String(productId))) continue

        uniqueItems.set(String(productId), {
          productId: String(productId),
          name: item.name,
          image: item.image
        })
      }

      return [...uniqueItems.values()]
    })
    const currentStatus = computed(() => statusSteps[selectedStatusIndex.value] || {
      title: statusLabel(selectedOrder.value?.orderStatus),
      description: 'Your order status has been updated.'
    })

    const loadOrders = async () => {
      const requestId = ++latestLoad
      isLoading.value = true
      errorMessage.value = ''
      orders.value = []
      selectedOrder.value = null

      try {
        try {
          localStorage.removeItem(TRACKED_ORDERS_KEY)
        } catch (storageError) {
          console.warn('Unable to clear old shared order tracking data:', storageError)
        }
        const routeOrderNumber = typeof route.query.orderNumber === 'string' ? route.query.orderNumber : ''
        const loadedOrders = await authFetch('/orders/mine')
        if (requestId !== latestLoad) return

        orders.value = loadedOrders

        const requestedOrder = loadedOrders.find((entry) => entry.orderNumber === routeOrderNumber)
        selectedOrder.value = routeOrderNumber
          ? requestedOrder || null
          : loadedOrders[0] || null
        if (selectedOrder.value?.orderStatus === 'delivered') {
          loadOrderReviews(selectedOrder.value)
        }
        if (routeOrderNumber && !requestedOrder) {
          errorMessage.value = 'That order is not associated with your account.'
        }
      } catch (error) {
        if (requestId !== latestLoad) return
        errorMessage.value = error instanceof TypeError
          ? 'Could not connect to the order service. Please refresh to try again.'
          : error.message || 'Could not load your orders.'
      } finally {
        if (requestId === latestLoad) {
          isLoading.value = false
        }
      }
    }

    const selectOrder = (order) => {
      if (!order.loadError) {
        selectedOrder.value = order
        if (order.orderStatus === 'delivered') {
          loadOrderReviews(order)
        }
      }
    }

    const getReviewState = (productId) => {
      if (!reviewStates.value[productId]) {
        reviewStates.value[productId] = {
          rating: 0,
          comment: '',
          review: null,
          loading: false,
          saving: false,
          error: '',
          success: ''
        }
      }
      return reviewStates.value[productId]
    }

    const loadOrderReviews = async (order) => {
      const items = new Map()
      for (const item of order.items || []) {
        const productId = typeof item.product === 'string'
          ? item.product
          : item.product?._id
        if (productId) items.set(String(productId), String(productId))
      }

      await Promise.all([...items.values()].map(async (productId) => {
        const state = getReviewState(productId)
        state.loading = true
        state.error = ''
        try {
          const data = await authFetch(`/products/${productId}/reviews`)
          const ownReview = (data.reviews || []).find(
            review => String(review.user?._id || review.user) === String(user.value?._id)
          )
          state.review = ownReview || null
          state.rating = ownReview?.rating || 0
          state.comment = ownReview?.comment || ''
        } catch (error) {
          console.error('Failed to load order product review:', error)
          state.error = error.message || 'Your review could not be loaded.'
        } finally {
          state.loading = false
        }
      }))
    }

    const setReviewRating = (productId, rating) => {
      getReviewState(productId).rating = rating
    }

    const setReviewComment = (productId, comment) => {
      getReviewState(productId).comment = comment
    }

    const submitOrderReview = async (productId) => {
      const state = getReviewState(productId)
      if (!state.rating || !state.comment.trim() || state.saving || state.review) return

      state.saving = true
      state.error = ''
      state.success = ''
      try {
        const result = await authFetch(`/products/${productId}/reviews`, {
          method: 'POST',
          body: JSON.stringify({
            rating: state.rating,
            comment: state.comment
          })
        })
        state.review = result.review
        state.success = 'Your review has been submitted and cannot be changed.'
      } catch (error) {
        state.error = error.message || 'Your review could not be saved.'
      } finally {
        state.saving = false
      }
    }

    const statusLabel = (status) => {
      if (!status) return ''
      return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    }

    const formatDate = (date) => new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(amount || 0)

    watch(
      () => user.value?._id,
      (userId) => {
        latestLoad++
        isLoading.value = false
        orders.value = []
        selectedOrder.value = null
        reviewStates.value = {}
        if (userId) {
          loadOrders()
        } else {
          router.replace({ name: 'Login', query: { redirect: route.fullPath } })
        }
      }
    )

    onMounted(() => {
      if (isAuthenticated.value) {
        loadOrders()
      }
    })

    return {
      orders,
      selectedOrder,
      reviewItems,
      getReviewState,
      isLoading,
      errorMessage,
      statusSteps,
      selectedStatusIndex,
      firstName,
      currentStatus,
      loadOrders,
      selectOrder,
      setReviewRating,
      setReviewComment,
      submitOrderReview,
      statusLabel,
      formatDate,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.track-order-page {
  min-height: 100%;
  padding-bottom: var(--space-12);
  background: #f7faf8;
}

.tracking-hero {
  padding: var(--space-12) 0;
  background:
    radial-gradient(ellipse at 12% 18%, rgba(216, 240, 218, 0.9), transparent 38%),
    linear-gradient(120deg, #f1f8f2, #fffdf6 72%);
}

.hero-copy {
  max-width: 780px;
}

.hero-copy h1 {
  margin: var(--space-4) 0;
  color: var(--green-700);
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.hero-copy h1 span {
  color: var(--green-500);
}

.hero-copy > p:last-child {
  max-width: 560px;
  margin: 0;
  color: var(--ink-medium);
  font-size: var(--text-lg);
  line-height: 1.7;
}

.eyebrow {
  margin: 0;
  color: var(--green-600);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.orders-container {
  padding-top: var(--space-8);
}

.orders-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.orders-heading h2 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-1) 0 0;
  font-size: var(--text-2xl);
}

.order-count {
  display: inline-grid;
  min-width: 26px;
  height: 26px;
  place-items: center;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--green-100);
  color: var(--green-700);
  font-size: var(--text-sm);
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid #dfe8e1;
  border-radius: 10px;
  background: white;
  color: var(--green-700);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.refresh-button span {
  font-size: 1.2rem;
}

.orders-layout {
  display: grid;
  grid-template-columns: minmax(290px, 0.85fr) minmax(0, 1.5fr);
  align-items: start;
  gap: var(--space-4);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.order-card,
.tracking-result,
.empty-state {
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: white;
  box-shadow: 0 10px 35px rgba(27, 62, 40, 0.06);
}

.order-card {
  overflow: hidden;
}

.order-card-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.order-card-button:hover,
.order-card-button.selected {
  background: #f5faf6;
}

.order-card-button.selected {
  box-shadow: inset 3px 0 var(--green-500);
}

.order-thumbnail {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 12px;
  background: #f4f8f4;
  object-fit: contain;
}

.image-placeholder {
  display: grid;
  place-items: center;
  font-size: 1.6rem;
}

.order-card-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 7px;
}

.order-card-top,
.order-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.order-card-top > strong,
.order-card-bottom > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-card-top > strong {
  font-size: var(--text-sm);
}

.order-card-meta {
  color: var(--ink-light);
  font-size: var(--text-xs);
}

.order-card-bottom {
  color: var(--ink-light);
  font-size: var(--text-xs);
}

.order-card-bottom strong {
  flex-shrink: 0;
  color: var(--ink);
}

.order-chevron {
  color: var(--ink-light);
  font-size: 1.6rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 999px;
  background: var(--green-100);
  color: var(--green-700);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.order-load-error {
  margin: 0;
  padding: 0 var(--space-4) var(--space-3);
  color: var(--error);
  font-size: var(--text-xs);
}

.tracking-result {
  padding: var(--space-5);
}

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.order-header h2 {
  margin: var(--space-2) 0;
  color: var(--ink);
  font-size: var(--text-2xl);
}

.order-meta {
  margin: 0;
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.order-meta strong {
  color: var(--ink);
}

.journey-card,
.items-card,
.delivery-card {
  padding: var(--space-5);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: white;
}

.journey-card {
  margin-top: var(--space-4);
}

.journey-heading,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.journey-heading h3,
.section-heading h3,
.delivery-card > h3 {
  margin: var(--space-1) 0;
  font-size: var(--text-xl);
}

.journey-heading p {
  margin: var(--space-1) 0 0;
  color: var(--ink-light);
}

.updated-label,
.section-heading > span {
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.status-timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  margin: var(--space-8) 0 var(--space-3);
  padding: 0 var(--space-2);
  list-style: none;
}

.status-timeline li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink-light);
  font-size: var(--text-xs);
  text-align: center;
}

.status-timeline li:not(:last-child)::after {
  position: absolute;
  top: 15px;
  left: calc(50% + 21px);
  width: calc(100% - 42px);
  height: 2px;
  background: #e7ece8;
  content: '';
}

.status-timeline li.complete:not(:last-child)::after {
  background: var(--green-300);
}

.timeline-marker {
  display: grid;
  z-index: 1;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 2px solid #e5ebe6;
  border-radius: 50%;
  background: white;
  font-weight: 700;
}

.status-timeline li.complete {
  color: var(--green-700);
  font-weight: 600;
}

.status-timeline li.complete .timeline-marker {
  border-color: var(--green-500);
  background: var(--green-500);
  color: white;
}

.status-timeline li.current .timeline-marker {
  box-shadow: 0 0 0 5px var(--green-100);
}

.timeline-title {
  font-weight: 600;
}

.timeline-description {
  color: var(--ink-light);
}

.order-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(230px, 0.8fr);
  align-items: start;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.section-heading {
  margin-bottom: var(--space-3);
}

.section-heading .eyebrow,
.delivery-card .eyebrow {
  font-size: var(--text-xs);
}

.items-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.order-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 1px solid #eef1ee;
}

.item-image {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 10px;
  background: #f4f8f4;
  object-fit: contain;
}

.item-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  font-size: var(--text-sm);
}

.item-info > span {
  color: var(--ink-light);
}

.item-variant {
  color: var(--green-700) !important;
}

.item-price {
  flex-shrink: 0;
  font-size: var(--text-xs);
}

.delivery-card > h3 {
  margin-bottom: var(--space-4);
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin: var(--space-3) 0;
}

.detail-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--green-50);
  color: var(--green-700);
}

.detail-row strong {
  font-size: var(--text-sm);
}

.detail-row p {
  margin: 4px 0 0;
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.price-summary {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid #eef1ee;
  font-size: var(--text-sm);
}

.price-summary > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin: var(--space-2) 0;
  color: var(--ink-light);
}

.price-summary .total-row {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid #eef1ee;
  color: var(--ink);
  font-size: var(--text-base);
}

.feedback-card {
  margin-top: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: #fbfdfb;
}

.feedback-heading h3 {
  margin: var(--space-1) 0;
  font-size: var(--text-xl);
}

.feedback-heading > p:last-child {
  margin: 0;
  color: var(--ink-light);
}

.feedback-item {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid #e8eee9;
}

.feedback-item-heading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.feedback-item-heading h4 {
  margin: 0;
}

.feedback-image {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 10px;
  background: #f0f5f0;
  object-fit: contain;
}

.feedback-form {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
}

.feedback-label {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.feedback-form textarea {
  width: 100%;
  min-height: 100px;
  padding: var(--space-3);
  border: 1px solid #dfe8e1;
  border-radius: 10px;
  font: inherit;
  resize: vertical;
}

.feedback-form textarea:focus {
  border-color: var(--green-500);
  outline: 2px solid var(--green-100);
}

.feedback-submit {
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-radius: 10px;
  background: var(--green-700);
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.feedback-submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.feedback-message {
  margin: 0;
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.feedback-message.error {
  color: var(--error);
}

.feedback-message.success {
  color: var(--green-700);
}

.feedback-submitted {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
}

.feedback-submitted > p:last-child {
  margin: 0;
  color: var(--ink-medium);
  overflow-wrap: anywhere;
}

.empty-state {
  max-width: 700px;
  margin: var(--space-5) auto;
  padding: var(--space-8);
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
}

.empty-state h2 {
  margin: var(--space-3) 0 0;
  font-size: var(--text-xl);
}

.empty-state p {
  margin: var(--space-2) auto var(--space-4);
  color: var(--ink-light);
}

.shop-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--green-700);
  font-weight: 700;
  text-decoration: none;
}

.shop-button:hover {
  color: var(--green-500);
}

.page-message {
  margin: var(--space-3) 0;
  font-size: var(--text-sm);
}

.error-message {
  color: var(--error);
}

.loading-spinner {
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid var(--green-100);
  border-top-color: var(--green-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .orders-layout {
    grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr);
  }

  .order-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .tracking-hero {
    padding: var(--space-8) 0;
  }

  .hero-copy h1 {
    font-size: var(--text-3xl);
  }

  .hero-copy > p:last-child {
    font-size: var(--text-base);
  }

  .orders-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .orders-heading {
    align-items: flex-start;
  }

  .refresh-button {
    padding: var(--space-2);
    font-size: var(--text-xs);
  }

  .tracking-result {
    padding: var(--space-3);
  }

  .order-header {
    flex-direction: column;
  }

  .journey-card,
  .items-card,
  .delivery-card {
    padding: var(--space-4);
  }

  .journey-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-timeline {
    gap: 2px;
    margin-top: var(--space-6);
    padding: 0;
  }

  .status-timeline li {
    font-size: 0.65rem;
  }

  .status-timeline li:not(:last-child)::after {
    top: 13px;
    left: calc(50% + 17px);
    width: calc(100% - 34px);
  }

  .timeline-description {
    display: none;
  }

  .timeline-marker {
    width: 28px;
    height: 28px;
  }
}
</style>
