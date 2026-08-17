<template>
  <div class="product-skeleton">
    <div class="skeleton-image skeleton"></div>
    <div class="skeleton-content">
      <div class="skeleton-title skeleton"></div>
      <div class="skeleton-price skeleton"></div>
      <div class="skeleton-rating skeleton"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductSkeleton'
}
</script>

<style scoped>
.product-skeleton {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.skeleton-image {
  width: 100%;
  height: 240px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.skeleton-content {
  padding: var(--space-4);
}

.skeleton-title {
  height: 20px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
}

.skeleton-price {
  height: 24px;
  width: 80px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
}

.skeleton-rating {
  height: 16px;
  width: 120px;
  border-radius: var(--radius-sm);
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>