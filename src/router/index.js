import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../components/AppLayout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Customers from '../views/Customers.vue'
import Jobs from '../views/Jobs.vue'
import Models from '../views/Models.vue'
import Backup from '../views/Backup.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { public: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/customers' },
      { path: 'customers', name: 'Customers', component: Customers },
      { path: 'models', name: 'Models', component: Models },
      { path: 'jobs', name: 'Jobs', component: Jobs },
      { path: 'backup', name: 'Backup', component: Backup, meta: { requiresSuperAdmin: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  const hasToken = !!auth.token
  if (to.meta.requiresAuth && !hasToken) {
    next({ name: 'Login' })
  } else if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) {
    next({ path: '/customers' })
  } else if (to.meta.public && hasToken && (to.name === 'Login' || to.name === 'Register')) {
    next({ path: '/customers' })
  } else {
    next()
  }
})

export default router
