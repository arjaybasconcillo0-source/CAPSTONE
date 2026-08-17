<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="success-modal" @click.stop>
      <!-- Success Animation -->
      <div class="success-animation">
        <div class="checkmark-circle">
          <div class="checkmark"></div>
        </div>
      </div>

      <!-- Success Content -->
      <div class="success-content">
        <h2 class="success-title">Order Placed Successfully!</h2>
        <p class="success-message">
          Thank you for your purchase. Your order has been confirmed and will be processed shortly.
        </p>
        
        <div class="order-details">
          <div class="order-number">
            <span class="order-label">Order Number:</span>
            <span class="order-value">{{ orderNumber }}</span>
          </div>
          
          <div class="next-steps">
            <h3>What happens next?</h3>
            <ul class="steps-list">
              <li>
                <CheckIcon />
                <span>Order confirmation email sent</span>
              </li>
              <li>
                <TruckIcon />
                <span>Items will be prepared for shipping</span>
              </li>
              <li>
                <GiftIcon />
                <span>You'll receive tracking information within 24 hours</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="success-actions">
          <button @click="$emit('close')" class="btn btn-primary btn-lg">
            Continue Shopping
          </button>
          <button @click="trackOrder" class="btn btn-ghost">
            Track Order
          </button>
        </div>
      </div>

      <!-- Close Button -->
      <button @click="$emit('close')" class="modal-close">
        <XIcon />
      </button>
    </div>
  </div>
</template>

<script>
// Icons
const CheckIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  `
}

const TruckIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  `
}

const GiftIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,12 20,22 4,22 4,12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="m12 7-3-3a1.5 1.5 0 0 0-1.061-.44 1.5 1.5 0 0 0-1.06.44 1.5 1.5 0 0 0 0 2.12L12 7"/>
      <path d="m12 7 3-3a1.5 1.5 0 0 1 1.061-.44 1.5 1.5 0 0 1 1.06.44 1.5 1.5 0 0 1 0 2.12L12 7"/>
    </svg>
  `
}

const XIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `
}

export default {
  name: 'OrderSuccessModal',
  components: {
    CheckIcon,
    TruckIcon,
    GiftIcon,
    XIcon
  },
  props: {
    orderNumber: {
      type: String,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const trackOrder = () => {
      // Mock tracking functionality
      if (window.showToast) {
        window.showToast('Order tracking feature coming soon!', 'info')
      }
      emit('close')
    }

    return {
      trackOrder
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.success-modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: var(--space-8) var(--space-6) var(--space-6) var(--space-6);
  text-align: center;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 40px;
  height: 40px;
  border: none;
  background: var(--green-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.modal-close:hover {
  background: var(--green-200);
}

/* Success Animation */
.success-animation {
  margin-bottom: var(--space-6);
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--green-500);
  margin: 0 auto;
  position: relative;
  animation: checkmarkCircle 0.5s ease-out;
}

@keyframes checkmarkCircle {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.checkmark {
  width: 40px;
  height: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.checkmark::after {
  content: '';
  position: absolute;
  left: 13px;
  top: 6px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
  animation: checkmarkDraw 0.3s ease-out 0.2s;
  animation-fill-mode: both;
}

@keyframes checkmarkDraw {
  from {
    opacity: 0;
    transform: rotate(45deg) scale(0);
  }
  to {
    opacity: 1;
    transform: rotate(45deg) scale(1);
  }
}

/* Success Content */
.success-content {
  margin-bottom: var(--space-6);
}

.success-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--green-700);
  margin-bottom: var(--space-3);
}

.success-message {
  color: var(--ink);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.order-details {
  text-align: left;
  background: var(--bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.order-number {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--green-100);
  margin-bottom: var(--space-4);
}

.order-label {
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.order-value {
  font-family: monospace;
  font-weight: 600;
  color: var(--green-600);
  background: var(--green-50);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.next-steps h3 {
  font-size: var(--text-base);
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.steps-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink-light);
  font-size: var(--text-sm);
}

.steps-list svg {
  color: var(--green-500);
}

.success-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.success-actions .btn {
  flex: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .success-modal {
    margin: var(--space-4);
    padding: var(--space-6) var(--space-4) var(--space-4) var(--space-4);
  }
  
  .success-title {
    font-size: var(--text-xl);
  }
  
  .checkmark-circle {
    width: 60px;
    height: 60px;
  }
  
  .checkmark {
    width: 30px;
    height: 30px;
  }
  
  .checkmark::after {
    left: 10px;
    top: 4px;
    width: 5px;
    height: 10px;
    border-width: 0 2px 2px 0;
  }
  
  .success-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--space-2);
  }
  
  .success-modal {
    margin: var(--space-2);
    padding: var(--space-4) var(--space-3) var(--space-3) var(--space-3);
  }
  
  .order-number {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
}
</style>