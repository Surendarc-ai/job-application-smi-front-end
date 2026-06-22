<template>
  <div class="page-card">
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-800 m-0 mb-4">Models</h1>

      <div class="flex items-center gap-3 flex-wrap">
        <button type="button" class="btn-primary shrink-0" @click="openModal()">
          + Add Model
        </button>

        <div class="search-bar">
          <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by name or description..."
            class="search-bar-input"
          />
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-md">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-slate-800 m-0">
            {{ editingId ? 'Edit Model' : 'Add New Model' }}
          </h2>
          <button
            type="button"
            class="text-2xl text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer"
            @click="closeModal"
          >&times;</button>
        </div>
        <form @submit.prevent="save">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label for="modelName" class="label-field">Model Name *</label>
              <input id="modelName" v-model="form.name" type="text" placeholder="e.g. Cabinet" required class="input-field" />
            </div>
            <div>
              <label for="modelDescription" class="label-field">Description</label>
              <textarea
                id="modelDescription"
                v-model="form.description"
                rows="4"
                placeholder="Model details, specs, notes..."
                class="input-field resize-y min-h-[100px]"
              />
            </div>
          </div>
          <p v-if="formError" class="error-msg mt-3">{{ formError }}</p>
          <div class="flex justify-end gap-3 mt-5">
            <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ editingId ? 'Update' : '+ Add Model' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div>
      <p v-if="loading" class="empty-msg">Loading...</p>
      <p v-else-if="error" class="error-msg">{{ error }}</p>
      <p v-else-if="filteredModels.length === 0" class="empty-msg">
        {{ search ? 'No models match your search.' : 'No models yet. Click "+ Add Model".' }}
      </p>
      <div v-else>
        <p class="text-sm text-slate-500 mb-2 px-3">
          Total Models:
          <span class="font-medium text-slate-700">{{ filteredModels.length }}</span>
        </p>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="model in filteredModels" :key="model._id">
                <td class="font-medium text-slate-800">{{ model.name }}</td>
                <td>{{ model.description || '—' }}</td>
                <td class="relative">
                  <div class="action-menu">
                    <button
                      type="button"
                      class="action-menu-btn"
                      aria-label="Model actions"
                      aria-haspopup="menu"
                      :aria-expanded="openMenuId === model._id"
                      @click="toggleMenu(model._id, $event)"
                    >
                      <Settings :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="openMenuId && openModel"
        class="action-dropdown action-dropdown-portal"
        :style="menuStyle"
        role="menu"
      >
        <button type="button" class="action-dropdown-item" role="menuitem" @click="onEdit(openModel)">Edit</button>
        <button type="button" class="action-dropdown-item action-dropdown-item-danger" role="menuitem" @click="onDelete(openModel._id)">Delete</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Search, Settings } from '@lucide/vue'
import { modelsApi } from '../api/models'

const models = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const openMenuId = ref(null)
const menuStyle = ref({})

const emptyForm = () => ({
  name: '',
  description: '',
})

const form = reactive(emptyForm())

const filteredModels = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return models.value
  return models.value.filter((m) => {
    const haystack = [m.name, m.description].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })
})

const openModel = computed(() =>
  filteredModels.value.find((m) => m._id === openMenuId.value)
  ?? models.value.find((m) => m._id === openMenuId.value)
)

async function fetchModels() {
  loading.value = true
  error.value = ''
  try {
    models.value = await modelsApi.list()
  } catch (e) {
    error.value = e.message || 'Failed to load models'
  } finally {
    loading.value = false
  }
}

function openModal(model = null) {
  formError.value = ''
  editingId.value = model?._id || null
  Object.assign(form, model ? {
    name: model.name || '',
    description: model.description || '',
  } : emptyForm())
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      const updated = await modelsApi.update(editingId.value, { ...form })
      const idx = models.value.findIndex((m) => m._id === editingId.value)
      if (idx !== -1) models.value[idx] = updated
    } else {
      const created = await modelsApi.create({ ...form })
      models.value.unshift(created)
    }
    closeModal()
  } catch (e) {
    formError.value = e.message || 'Failed to save model'
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('Delete this model?')) return
  try {
    await modelsApi.delete(id)
    models.value = models.value.filter((m) => m._id !== id)
  } catch (e) {
    error.value = e.message || 'Failed to delete model'
  }
}

function toggleMenu(id, event) {
  event.stopPropagation()
  if (openMenuId.value === id) {
    closeMenu()
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const menuWidth = 120
  menuStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(8, rect.right - menuWidth)}px`,
  }
  openMenuId.value = id
}

function closeMenu() {
  openMenuId.value = null
}

function onEdit(model) {
  closeMenu()
  openModal(model)
}

function onDelete(id) {
  closeMenu()
  remove(id)
}

function onDocumentClick(event) {
  if (!event.target.closest('.action-menu') && !event.target.closest('.action-dropdown')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  fetchModels()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>
