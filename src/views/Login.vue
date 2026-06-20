<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-semibold text-slate-800 mb-6">Login</h1>
      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label for="username" class="label-field">Username</label>
          <input id="username" v-model="username" type="text" required autocomplete="username" class="input-field" />
        </div>
        <div class="mb-4">
          <label for="password" class="label-field">Password</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password" class="input-field" />
        </div>
        <p v-if="error" class="error-msg mb-3">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">Login</button>
      </form>
      <!-- <p class="mt-4 text-sm text-center">
        <router-link to="/register" class="text-blue-500 hover:underline">Create account</router-link>
      </p> -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push('/customers')
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
