<template>
  <div 
    class="product-grid"
    :class="{
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
      'grid-cols-5': columns === 5
    }"
  >
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
</template>

<script>
import ProductCard from './ProductCard.vue'

export default {
  name: 'ProductGrid',
  components: {
    ProductCard
  },
  props: {
    products: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Number,
      default: 4
    }
  }
}
</script>

<style scoped>
.product-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-cols-3 {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.grid-cols-5 {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

/* Responsive adjustments */
@media (min-width: 1200px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .grid-cols-5 {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-3);
  }
}
</style>