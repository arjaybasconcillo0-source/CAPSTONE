<template>
  <section class="settings-page">
    <div class="settings-card">
      <header class="settings-header">
        <p class="eyebrow">Account settings</p>
        <h1>Change password</h1>
        <p>Update your password for this account.</p>
      </header>

      <form class="password-form" @submit.prevent="changePassword">
        <label>
          Current password
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            required
          >
        </label>

        <label>
          New password
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
          >
        </label>

        <label>
          Confirm new password
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
          >
        </label>

        <p v-if="message" class="form-message success" role="status">{{ message }}</p>
        <p v-if="error" class="form-message error" role="alert">{{ error }}</p>

        <button type="submit" :disabled="isSaving">
          {{ isSaving ? 'Updating password...' : 'Update password' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'

export default {
  name: 'SettingsPage',
  setup() {
    const { authFetch } = useAuth()
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const isSaving = ref(false)
    const message = ref('')
    const error = ref('')

    const changePassword = async () => {
      message.value = ''
      error.value = ''
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'New passwords do not match.'
        return
      }

      isSaving.value = true
      try {
        const result = await authFetch('/auth/change-password', {
          method: 'PATCH',
          body: JSON.stringify({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value
          })
        })
        message.value = result.message
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
      } catch (requestError) {
        error.value = requestError.message || 'Password could not be changed. Please try again.'
      } finally {
        isSaving.value = false
      }
    }

    return {
      currentPassword,
      newPassword,
      confirmPassword,
      isSaving,
      message,
      error,
      changePassword
    }
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.settings-card {
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

.settings-header {
  margin-bottom: 1.5rem;
}

.settings-header .eyebrow {
  margin: 0 0 0.5rem;
  color: #2d5a27;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.settings-header h1 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1.6rem;
}

.settings-header > p:last-child {
  margin: 0;
  color: #64748b;
}

.password-form {
  display: grid;
  gap: 1rem;
}

.password-form label {
  display: grid;
  gap: 0.4rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

.password-form input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  font: inherit;
}

.password-form input:focus {
  outline: 2px solid #86a982;
  outline-offset: 1px;
}

.password-form button {
  justify-self: start;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 8px;
  background: #2d5a27;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.password-form button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.form-message {
  margin: 0;
  font-size: 0.9rem;
}

.form-message.success {
  color: #166534;
}

.form-message.error {
  color: #b91c1c;
}

@media (max-width: 520px) {
  .settings-page {
    padding: 1rem;
  }

  .settings-card {
    padding: 1.25rem;
  }
}
</style>
