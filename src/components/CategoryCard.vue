<template>
  <router-link 
    :to="`/shop?category=${category.slug}`"
    class="category-card"
    :aria-label="`Shop ${category.name} category`"
  >
    <div class="category-image">
      <img 
        :src="category.image" 
        :alt="category.name"
        loading="lazy"
      >
      <div class="category-overlay">
        <div class="category-info">
          <h3 class="category-name">{{ category.name }}</h3>
          <p class="category-description">{{ category.description }}</p>
          <span v-if="category.productCount" class="category-count">
            {{ category.productCount }} items
          </span>
        </div>
        <div class="category-arrow">
          <ArrowIcon />
        </div>
      </div>
    </div>
  </router-link>
</template>

<script>
const ArrowIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="7" y1="17" x2="17" y2="7"/>
      <polyline points="7,7 17,7 17,17"/>
    </svg>
  `
}

export default {
  name: 'CategoryCard',
  components: {
    ArrowIcon
  },
  props: {
    category: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.category-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-xl);
  overflow: hidden;
  transform: translateY(0);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  height: 320px;
  position: relative;
}

.category-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-2xl);
  border-color: var(--green-200);
}

.category-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.category-card:hover .category-image img {
  transform: scale(1.05);
}

.category-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 46, 19, 0) 0%,
    rgba(11, 46, 19, 0.6) 50%,
    rgba(11, 46, 19, 0.92) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-8);
  color: white;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.category-card:hover .category-overlay {
  opacity: 1;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.category-name {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: white;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.category-description {
  font-size: var(--text-base);
  line-height: 1.5;
  margin-bottom: var(--space-2);
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.category-count {
  font-size: var(--text-sm);
  opacity: 0.8;
  font-weight: 500;
}

.category-arrow {
  align-self: flex-end;
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  transform: translateX(10px);
  transition: transform var(--transition-base);
}

.category-card:hover .category-arrow {
  transform: translateX(0);
}

/* Alternative layout with always visible text */
@media (max-width: 768px) {
  .category-overlay {
    opacity: 1;
    background: linear-gradient(
      to top,
      rgba(11, 46, 19, 0.92) 0%,
      rgba(11, 46, 19, 0.5) 50%,
      rgba(11, 46, 19, 0.1) 100%
    );
    justify-content: flex-end;
  }

  .category-card {
    height: 220px;
  }

  .category-name {
    font-size: var(--text-xl);
  }

  .category-description {
    font-size: var(--text-sm);
  }
}
</style>