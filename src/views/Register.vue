<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-semibold text-slate-800 mb-6">Register</h1>
      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label for="username" class="label-field">Username</label>
          <input id="username" v-model="username" type="text" required autocomplete="username" class="input-field" />
        </div>
        <div class="mb-4">
          <label for="password" class="label-field">Password</label>
          <input id="password" v-model="password" type="password" required autocomplete="new-password" class="input-field" />
        </div>
        <div class="mb-4">
          <label for="companyName" class="label-field">Company Name</label>
          <input id="companyName" v-model="companyName" type="text" required placeholder="Your company name" class="input-field" />
        </div>
        <p v-if="error" class="error-msg mb-3">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">Register</button>
      </form>
      <p class="mt-4 text-sm text-center">
        <router-link to="/login" class="text-blue-500 hover:underline">Back to Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../api/auth'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const companyName = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const data = await authApi.register(username.value, password.value, companyName.value)
    auth.setAuth(data.token, data.user)
    router.push('/customers')
  } catch (e) {
    error.value = e.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
