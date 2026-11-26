<template>
  <div class="product-accordion">
    <button 
      @click="toggleOpen"
      class="accordion-header"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${_uid}`"
    >
      <span class="accordion-title">{{ title }}</span>
      <span class="accordion-icon" :class="{ 'open': isOpen }">
        <ChevronDownIcon />
      </span>
    </button>
    
    <div 
      :id="`accordion-content-${_uid}`"
      class="accordion-content"
      :class="{ 'open': isOpen }"
      :style="{ maxHeight: isOpen ? contentHeight + 'px' : '0px' }"
    >
      <div ref="content" class="accordion-inner">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted, getCurrentInstance } from 'vue'

const ChevronDownIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  `
}

export default {
  name: 'ProductAccordion',
  components: {
    ChevronDownIcon
  },
  props: {
    title: {
      type: String,
      required: true
    },
    defaultOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const instance = getCurrentInstance()
    const isOpen = ref(props.defaultOpen)
    const content = ref(null)
    const contentHeight = ref(0)
    
    const toggleOpen = async () => {
      isOpen.value = !isOpen.value
      
      if (isOpen.value) {
        await nextTick()
        if (content.value) {
          contentHeight.value = content.value.scrollHeight
        }
      }
    }
    
    onMounted(() => {
      if (props.defaultOpen && content.value) {
        contentHeight.value = content.value.scrollHeight
      }
    })
    
    return {
      isOpen,
      content,
      contentHeight,
      toggleOpen,
      _uid: instance.uid
    }
  }
}
</script>

<style scoped>
.product-accordion {
  border: 1px solid var(--green-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--surface);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  text-align: left;
}

.accordion-header:hover {
  background: var(--green-50);
}

.accordion-header:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: -2px;
}

.accordion-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--ink);
}

.accordion-icon {
  color: var(--green-600);
  transition: transform var(--transition-base);
  display: flex;
  align-items: center;
}

.accordion-icon.open {
  transform: rotate(180deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-base);
  background: var(--bg);
}

.accordion-inner {
  padding: var(--space-4);
}

/* Content Styling */
.accordion-inner :deep(.accordion-content h4) {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--green-700);
  margin-bottom: var(--space-2);
  margin-top: var(--space-4);
}

.accordion-inner :deep(.accordion-content h4:first-child) {
  margin-top: 0;
}

.accordion-inner :deep(.accordion-content ul) {
  list-style: none;
  margin-bottom: var(--space-4);
  padding: 0;
}

.accordion-inner :deep(.accordion-content li) {
  position: relative;
  padding-left: var(--space-4);
  margin-bottom: var(--space-1);
  color: var(--ink-light);
  line-height: 1.6;
}

.accordion-inner :deep(.accordion-content li::before) {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--green-500);
  font-weight: bold;
}

.accordion-inner :deep(.accordion-content p) {
  color: var(--ink-light);
  line-height: 1.6;
  margin-bottom: var(--space-3);
}

.accordion-inner :deep(.accordion-content p:last-child) {
  margin-bottom: 0;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .accordion-content {
    transition: none;
  }
  
  .accordion-icon {
    transition: none;
  }
}
</style>