<template>
  <div 
    class="rating-stars" 
    :aria-label="`Rating: ${rating} out of 5 stars`"
    role="img"
  >
    <span 
      v-for="star in 5" 
      :key="star"
      class="star"
      :class="{
        'star-filled': star <= Math.floor(rating),
        'star-half': star === Math.ceil(rating) && rating % 1 !== 0,
        'star-empty': star > Math.ceil(rating)
      }"
      :style="{ fontSize: `${size}px` }"
    >
      <StarIcon 
        :filled="star <= Math.floor(rating)"
        :half="star === Math.ceil(rating) && rating % 1 !== 0"
      />
    </span>
  </div>
</template>

<script>
// Star Icon Component with different states
const StarIcon = {
  props: {
    filled: Boolean,
    half: Boolean
  },
  template: `
    <svg 
      :width="16" 
      :height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
    >
      <defs v-if="half">
        <linearGradient :id="'half-' + Math.random()" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" :stop-color="filled ? '#F4C430' : '#F4C430'" />
          <stop offset="50%" stop-color="transparent" />
        </linearGradient>
      </defs>
      <polygon 
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        :fill="filled ? '#F4C430' : (half ? \`url(#half-\${Math.random()})\` : 'transparent')"
        :stroke="filled || half ? '#F4C430' : '#e5e7eb'"
      />
    </svg>
  `
}

export default {
  name: 'RatingStars',
  components: {
    StarIcon
  },
  props: {
    rating: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 5
    },
    size: {
      type: Number,
      default: 16
    },
    interactive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['rate'],
  setup(props, { emit }) {
    const handleStarClick = (starIndex) => {
      if (props.interactive) {
        emit('rate', starIndex)
      }
    }

    return {
      handleStarClick
    }
  }
}
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  gap: 2px;
}

.star {
  color: var(--yellow-500);
  transition: all var(--transition-fast);
  cursor: default;
  display: inline-flex;
  align-items: center;
}

/* Interactive stars */
.rating-stars[data-interactive="true"] .star {
  cursor: pointer;
}

.rating-stars[data-interactive="true"] .star:hover {
  transform: scale(1.1);
}

.star-filled {
  color: var(--yellow-500);
}

.star-half {
  color: var(--yellow-500);
}

.star-empty {
  color: #e5e7eb;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .star {
    transition: none;
  }
  
  .rating-stars[data-interactive="true"] .star:hover {
    transform: none;
  }
}
</style>