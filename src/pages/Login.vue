<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>{{ isRegister ? 'Create Account' : 'Welcome Back' }}</h1>
        <p>{{ isRegister ? 'Join Water Lily Handicrafts' : 'Sign in to your account' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Name field (register only) -->
        <div v-if="isRegister" class="form-group">
          <label for="name">Full Name</label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            placeholder="Enter your full name"
            required
          />
        </div>

        <!-- Email field -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            placeholder="Enter your email"
            required
          />
        </div>

        <!-- Password field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            placeholder="Enter your password"
            required
            minlength="6"
          />
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Submit button -->
        <button type="submit" class="btn-submit" :disabled="isLoading">
          <span v-if="isLoading">Loading...</span>
          <span v-else>{{ isRegister ? 'Create Account' : 'Sign In' }}</span>
        </button>
      </form>

      <!-- Toggle between login and register -->
      <div class="toggle-form">
        <p v-if="isRegister">
          Already have an account?
          <a href="#" @click.prevent="toggleForm">Sign In</a>
        </p>
        <p v-else>
          Don't have an account?
          <a href="#" @click.prevent="toggleForm">Create Account</a>
        </p>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { login, register, isLoading, isAuthenticated, isAdmin } = useAuth()

    const isRegister = ref(false)
    const errorMessage = ref('')
    const formData = reactive({
      name: '',
      email: '',
      password: ''
    })

    const getPostLoginPath = () => {
      const redirect = route.query.redirect
      if (typeof redirect === 'string' && redirect.startsWith('/') &&
        !redirect.startsWith('//') && redirect !== '/login') {
        return redirect
      }

      return isAdmin.value ? '/admin' : '/'
    }

    if (isAuthenticated.value) {
      router.replace(getPostLoginPath())
    }

    const toggleForm = () => {
      isRegister.value = !isRegister.value
      errorMessage.value = ''
    }

    const handleSubmit = async () => {
      errorMessage.value = ''

      let result
      if (isRegister.value) {
        result = await register(formData.name, formData.email, formData.password)
      } else {
        result = await login(formData.email, formData.password)
      }

      if (result.success) {
        // Show toast
        if (window.showToast) {
          window.showToast(isRegister.value ? 'Account created successfully!' : 'Welcome back!', 'success')
        }
        
        router.replace(getPostLoginPath())
      } else {
        errorMessage.value = result.error
      }
    }

    return {
      isRegister,
      formData,
      errorMessage,
      isLoading,
      toggleForm,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.login-container {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #2d5a27;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #666;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #2d5a27;
  box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.1);
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.btn-submit {
  background: #2d5a27;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #1e3d1a;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toggle-form {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.toggle-form p {
  color: #666;
  font-size: 0.95rem;
}

.toggle-form a {
  color: #2d5a27;
  font-weight: 600;
  text-decoration: none;
}

.toggle-form a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-container {
    padding: 1.5rem;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }
}
</style>
