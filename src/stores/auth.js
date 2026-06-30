import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

const TOKEN_KEY = 'jobapp_token'
const USER_KEY = 'jobapp_user'
const SUPER_ADMIN_ROLE = 'Super Admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === SUPER_ADMIN_ROLE)

  function setAuth(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(newUser || {}))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  async function login(username, password) {
    const data = await authApi.login(username, password)
    setAuth(data.token, data.user)
    return data
  }

  function logout() {
    setAuth(null, null)
  }

  return { token, user, isAuthenticated, isSuperAdmin, login, logout, setAuth }
})
