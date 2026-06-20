<template>
  <aside class="h-screen shrink-0 w-56 bg-slate-800 text-slate-200 flex flex-col py-4">
    <div class="flex items-center gap-2 px-4 text-xl font-bold border-b border-slate-700 mb-4 pb-4">
      <Briefcase :size="22" class="text-blue-400 shrink-0" />
      <span>Job App</span>
    </div>

    <nav class="flex flex-col gap-1 px-2">
      <router-link to="/customers" class="nav-link" title="Customers">
        <Users :size="18" class="shrink-0" />
        <span>Customers</span>
      </router-link>
      <router-link to="/jobs" class="nav-link" title="Jobs">
        <Briefcase :size="18" class="shrink-0" />
        <span>Jobs</span>
      </router-link>
    </nav>

    <div class="mt-auto px-2 pt-4 border-t border-slate-700">
      <p v-if="auth.user?.company" class="px-2 mb-2 text-xs text-slate-400 truncate">{{ auth.user.company }}</p>
      <p v-else-if="auth.user" class="px-2 mb-2 text-xs text-slate-400 truncate">{{ auth.user.username }}</p>
      <button
        type="button"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-slate-600 text-slate-400 rounded-md text-sm hover:bg-slate-700 hover:text-slate-100 cursor-pointer"
        @click="logout"
      >
        <LogOut :size="16" class="shrink-0" />
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { Briefcase, Users, LogOut } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>
