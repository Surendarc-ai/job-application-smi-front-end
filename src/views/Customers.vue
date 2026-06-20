<template>
  <div class="page-card">
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-800 m-0 mb-4">Customers</h1>

      <div class="flex items-center gap-3 flex-wrap">
        <button type="button" class="btn-primary shrink-0" @click="openModal()">
          + Add Customer
        </button>

        <div class="search-bar">
          <Users :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, email, phone, GST..."
            class="search-bar-input"
          />
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-md">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-slate-800 m-0">
            {{ editingId ? 'Edit Customer' : 'Add New Customer' }}
          </h2>
          <button
            type="button"
            class="text-2xl text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer"
            @click="closeModal"
          >&times;</button>
        </div>
        <form @submit.prevent="save">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="firstName" class="label-field">First Name *</label>
              <input id="firstName" v-model="form.firstName" type="text" placeholder="John" required class="input-field" />
            </div>
            <div>
              <label for="lastName" class="label-field">Last Name</label>
              <input id="lastName" v-model="form.lastName" type="text" placeholder="Doe" class="input-field" />
            </div>
            <div>
              <label for="email" class="label-field">Email</label>
              <input id="email" v-model="form.email" type="email" placeholder="john@example.com" class="input-field" />
            </div>
            <div>
              <label for="phone" class="label-field">Phone</label>
              <input id="phone" v-model="form.phone" type="text" placeholder="+91 98765 43210" class="input-field" />
            </div>
            <div>
              <label for="address" class="label-field">Address</label>
              <input id="address" v-model="form.address" type="text" placeholder="123, ABC Street, Chennai" class="input-field" />
            </div>
            <div>
              <label for="gstNumber" class="label-field">GST Number</label>
              <input id="gstNumber" v-model="form.gstNumber" type="text" placeholder="22AAAAA0000A1Z5" class="input-field" />
            </div>
          </div>
          <p v-if="formError" class="error-msg mt-3">{{ formError }}</p>
          <p v-if="formSuccess" class="success-msg mt-3">{{ formSuccess }}</p>
          <div class="flex justify-end gap-3 mt-5">
            <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ editingId ? 'Update' : '+ Add Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div>
      <p v-if="loading" class="empty-msg">Loading...</p>
      <p v-else-if="error" class="error-msg">{{ error }}</p>
      <p v-else-if="filteredCustomers.length === 0" class="empty-msg">
        {{ search ? 'No customers match your search.' : 'No customers yet. Click "+ Add Customer".' }}
      </p>
      <div v-else>
        <div class="flex items-center justify-start mb-2 px-3">
          <p class="text-sm text-slate-500 m-0 whitespace-nowrap">
            Total Customers:
            <span class="font-medium text-slate-700">{{ filteredCustomers.length }}</span>
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>GST Number</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in filteredCustomers" :key="customer._id">
                <td>
                  <div class="customer-cell">
                    <span class="customer-avatar">{{ customerInitials(customer) }}</span>
                    <span class="font-medium text-slate-800">{{ fullName(customer) }}</span>
                  </div>
                </td>
                <td>{{ customer.email || '—' }}</td>
                <td>{{ customer.phone || '—' }}</td>
                <td>{{ customer.address || '—' }}</td>
                <td>{{ customer.gstNumber || '—' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button type="button" class="btn-edit" @click="openModal(customer)">Edit</button>
                    <button type="button" class="btn-delete" @click="remove(customer._id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Users } from '@lucide/vue'
import { customersApi } from '../api/customers'

const customers = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  gstNumber: '',
})

const form = reactive(emptyForm())

const filteredCustomers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return customers.value
  return customers.value.filter((c) => {
    const haystack = [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.address,
      c.gstNumber,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })
})

function fullName(customer) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ')
}

function customerInitials(c) {
  const parts = `${c.firstName || ''} ${c.lastName || ''}`.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

async function fetchCustomers() {
  loading.value = true
  error.value = ''
  try {
    customers.value = await customersApi.list()
  } catch (e) {
    error.value = e.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

function openModal(customer = null) {
  formError.value = ''
  formSuccess.value = ''
  editingId.value = customer?._id || null
  Object.assign(form, customer ? {
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    gstNumber: customer.gstNumber || '',
  } : emptyForm())
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  formError.value = ''
  formSuccess.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      const updated = await customersApi.update(editingId.value, { ...form })
      const idx = customers.value.findIndex((c) => c._id === editingId.value)
      if (idx !== -1) customers.value[idx] = updated
      formSuccess.value = 'Customer updated!'
    } else {
      const created = await customersApi.create({ ...form })
      customers.value.unshift(created)
      formSuccess.value = 'Customer added!'
    }
    setTimeout(() => closeModal(), 800)
  } catch (e) {
    formError.value = e.message || 'Failed to save customer'
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('Delete this customer?')) return
  try {
    await customersApi.delete(id)
    customers.value = customers.value.filter((c) => c._id !== id)
  } catch (e) {
    error.value = e.message || 'Failed to delete customer'
  }
}

onMounted(fetchCustomers)
</script>
