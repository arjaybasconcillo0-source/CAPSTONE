 <template>
  <div 
    class="toast-container"
    :class="[`toast-${type}`, { 'show': true }]"
    role="alert"
    aria-live="polite"
  >
    <div class="toast-content">
      <div class="toast-icon">
        <component :is="iconComponent" />
      </div>
      <div class="toast-message">
        {{ message }}
      </div>
      <button 
        @click="$emit('close')"
        class="toast-close"
        aria-label="Close notification"
      >
        <CloseIcon />
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

// Icon components
const SuccessIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  `
}

const ErrorIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  `
}

const WarningIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <circle cx="12" cy="17" stroke-width="3" fill="currentColor" r="1"/>
    </svg>
  `
}

const InfoIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <circle cx="12" cy="8" stroke-width="3" fill="currentColor" r="1"/>
    </svg>
  `
}

const CloseIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  `
}

export default {
  name: 'Toast',
  components: {
    SuccessIcon,
    ErrorIcon,
    WarningIcon,
    InfoIcon,
    CloseIcon
  },
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    }
  },
  emits: ['close'],
  setup(props) {
    const iconComponent = computed(() => {
      const iconMap = {
        success: 'SuccessIcon',
        error: 'ErrorIcon',
        warning: 'WarningIcon',
        info: 'InfoIcon'
      }
      return iconMap[props.type] || 'InfoIcon'
    })

    return {
      iconComponent
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 100px;
  right: var(--space-4);
  z-index: 9999;
  min-width: 300px;
  max-width: 500px;
  transform: translateX(100%);
  transition: transform var(--transition-base);
  pointer-events: none;
}

.toast-container.show {
  transform: translateX(0);
  pointer-events: auto;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--surface);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border-left: 4px solid;
}

.toast-success .toast-content {
  border-left-color: var(--green-500);
}

.toast-error .toast-content {
  border-left-color: var(--error);
}

.toast-warning .toast-content {
  border-left-color: var(--yellow-500);
}

.toast-info .toast-content {
  border-left-color: #3B82F6;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-success .toast-icon {
  color: var(--green-500);
}

.toast-error .toast-icon {
  color: var(--error);
}

.toast-warning .toast-icon {
  color: var(--yellow-600);
}

.toast-info .toast-icon {
  color: #3B82F6;
}

.toast-message {
  flex: 1;
  color: var(--ink);
  font-size: var(--text-base);
  line-height: 1.5;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--ink-light);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  margin-top: -2px;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--ink);
}

.toast-close:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: 1px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .toast-container {
    left: var(--space-3);
    right: var(--space-3);
    min-width: auto;
    max-width: none;
  }
}

/* Animations */
@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-container.show {
  animation: toast-slide-in 0.3s ease-out;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toast-container,
  .toast-container.show {
    animation: none;
    transition: none;
  }
}
</style>