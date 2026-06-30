<template>
  <div class="page-card">
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-800 m-0 mb-4">Jobs</h1>
      <div class="flex items-end gap-3 flex-wrap">
        <button type="button" class="btn-primary shrink-0 flex items-center gap-2" @click="openModal()">
          <Plus :size="16" />
          Add Job
        </button>
        <div class="search-bar">
          <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
          <input v-model="search" type="text" placeholder="Search by customer, project, model, bill no..." class="search-bar-input" />
        </div>
        <div>
          <label for="dateFrom" class="filter-label">From</label>
          <input id="dateFrom" v-model="dateFrom" type="date" class="filter-field" />
        </div>
        <div>
          <label for="dateTo" class="filter-label">To</label>
          <input id="dateTo" v-model="dateTo" type="date" class="filter-field" />
        </div>
        <div class="filter-customer">
          <label class="filter-label">Customer</label>
          <SearchableSelect
            v-model="customerFilter"
            placeholder="All"
            search-placeholder="Search customer..."
            :options="customerFilterOptionsList"
          />
        </div>
        <div>
          <label for="dcFilter" class="filter-label">Multiple DC</label>
          <select id="dcFilter" v-model="dcFilter" class="filter-field min-w-[120px]">
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <button type="button" class="btn-secondary shrink-0 flex items-center gap-2" :disabled="exporting || !totalJobs" @click="exportExcel">
          <FileSpreadsheet :size="16" />
          {{ exporting ? 'Exporting...' : 'Export Excel' }}
        </button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-lg">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-semibold text-slate-800 m-0">{{ editingId ? 'Edit Job' : 'Add New Job' }}</h2>
          <button type="button" class="text-2xl text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="save">
          <fieldset class="border border-slate-200 rounded-xl p-5 mb-5">
            <legend class="text-sm font-semibold text-blue-500 px-2">Job Details</legend>

            <div class="job-form-grid">
              <div>
                <label class="label-field uppercase">Date *</label>
                <input v-model="form.date" type="date" required class="input-field" />
              </div>
              <div class="lg:col-span-2">
                <label class="label-field uppercase">Customer *</label>
                <SearchableSelect
                  v-model="form.customer"
                  placeholder="Search customer..."
                  search-placeholder="Search customer..."
                  :load-options="loadCustomers"
                  option-value="_id"
                  :option-label="customerLabel"
                  :initial-option="editingCustomer"
                />
              </div>
              <div>
                <label class="label-field uppercase">Project Name *</label>
                <input v-model="form.projectName" type="text" required placeholder="e.g. Office signage" class="input-field" />
              </div>
            </div>

            <div class="job-form-grid">
              <div>
                <label class="label-field uppercase">Models</label>
                <select v-model="form.model" class="select-field">
                  <option value="">Select model...</option>
                  <option v-for="m in jobModelOptions" :key="m._id" :value="m.name">{{ m.name }}</option>
                </select>
              </div>
              <div>
                <label class="label-field uppercase">Pixel</label>
                <input v-model="form.pixel" type="text" placeholder="e.g. 300dpi" class="input-field" />
              </div>
              <div>
                <label class="label-field uppercase">Quantity</label>
                <input v-model="form.quantity" type="number" min="0" step="1" placeholder="e.g. 10" class="input-field" />
              </div>
              <div>
                <label class="label-field uppercase">Width (mm)</label>
                <input v-model="form.widthMm" type="number" min="0" step="0.01" placeholder="e.g. 2" class="input-field" />
              </div>
            </div>

            <div class="job-form-grid">
              <div>
                <label class="label-field uppercase">Length (mm)</label>
                <input v-model="form.lengthMm" type="number" min="0" step="0.01" placeholder="e.g. 4" class="input-field" />
              </div>
              <div>
                <label class="label-field uppercase">Price/Sqft (₹)</label>
                <input v-model="form.pricePerSqft" type="number" min="0" step="0.01" placeholder="e.g. 50" class="input-field" />
              </div>
            </div>

            <div class="mb-4">
              <label class="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  v-model="form.isDC"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  @change="onDcToggle"
                />
                <span class="label-field uppercase mb-0">Multiple DC</span>
              </label>
              <div v-if="form.isDC" class="mt-3 space-y-3">
                <div
                  v-for="(item, index) in form.dc"
                  :key="index"
                  class="border border-slate-200 rounded-lg p-3"
                >
                  <div class="job-form-grid mb-0">
                    <div>
                      <label class="label-field uppercase">Date</label>
                      <input v-model="item.date" type="date" class="input-field" />
                    </div>
                    <div>
                      <label class="label-field uppercase">Bill No</label>
                      <input v-model="item.billNo" type="text" placeholder="e.g. INV-001" class="input-field" />
                    </div>
                    <div>
                      <label class="label-field uppercase">Qty</label>
                      <input
                        v-model="item.quantity"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 10"
                        class="input-field"
                      />
                    </div>
                    <div>
                      <label class="label-field uppercase">Amount (₹)</label>
                      <div class="input-field bg-slate-50 text-slate-700 cursor-not-allowed">
                        {{ dcLineAmount(item) }}
                      </div>
                    </div>
                  </div>
                  <div v-if="form.dc.length > 1" class="flex justify-end mt-2">
                    <button type="button" class="btn-secondary text-sm px-3 py-1.5" @click="removeDc(index)">
                      Remove
                    </button>
                  </div>
                </div>
                <button type="button" class="btn-secondary text-sm" @click="addDc">Add New</button>
                <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 mt-2 px-1">
                  <span>Job qty: <strong class="text-slate-800">{{ form.quantity || 0 }}</strong></span>
                  <span>Delivered: <strong class="text-slate-800">{{ deliveredDcQty }}</strong></span>
                  <span>Remaining to deliver: <strong :class="remainingDcQty < 0 ? 'text-red-600' : 'text-blue-600'">{{ remainingDcQty }}</strong></span>
                </div>
              </div>
            </div>

            <div class="job-summary-box mt-5">
              <div class="job-summary-item job-summary-item-split">
                <div class="job-summary-block">
                  <span class="job-summary-label">Tot Size (Sq Ft)</span>
                  <span class="job-summary-hint">W × L in mm</span>
                  <span class="job-summary-value">{{ formatNum(totSizeSqFt) }}</span>
                </div>
                <div class="job-summary-block">
                  <span class="job-summary-label">Rounded Tot Sq Ft</span>
                  <span class="job-summary-hint">Rounded per unit</span>
                  <span class="job-summary-value">{{ formatRoundedTot(roundedTotSizeSqFt) }}</span>
                </div>
              </div>
              <div class="job-summary-item job-summary-item-single">
                <div class="job-summary-block">
                  <span class="job-summary-label">Tot Sqft</span>
                  <span class="job-summary-hint">Rounded Tot Sq Ft × Qty</span>
                  <span class="job-summary-value">{{ formatNum(totSqft) }}</span>
                </div>
              </div>
              <div class="job-summary-item job-summary-item-single">
                <div class="job-summary-block">
                  <span class="job-summary-label">Total Amount (₹)</span>
                  <span class="job-summary-hint">Tot Sqft × Price/Sqft</span>
                  <span class="job-summary-total">{{ formatNum(totalAmount) }}</span>
                </div>
              </div>
            </div>
          </fieldset>

          <p v-if="formError" class="error-msg">{{ formError }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ editingId ? 'Update Job' : 'Add Job' }}</button>
          </div>
        </form>
      </div>
    </div>

    <p v-if="loading" class="empty-msg">Loading...</p>
    <p v-else-if="error" class="error-msg">{{ error }}</p>
    <p v-else-if="jobs.length === 0" class="empty-msg">{{ emptyMessage }}</p>
    <div v-else>
      <p class="text-sm text-slate-500 mb-2 px-3">
        Total Jobs:<span class="font-medium text-slate-700">{{ totalJobs }}</span>
      </p>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Project Name</th>
              <th>Date</th>
              <th>Model</th>
              <th>Multiple DC</th>
              <th>Pixel</th>
              <th>W (mm)</th>
              <th>L (mm)</th>
              <th>Qty</th>
              <th>Tot Size (Sq Ft)</th>
              <th>Rounded Tot Sq Ft</th>
              <th>Tot Sqft</th>
              <th>Price/Sqft</th>
              <th>Total (₹)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in jobs" :key="job._id">
              <td>
                <div class="customer-cell">
                  <span class="customer-avatar">{{ customerInitials(job.customer) }}</span>
                  <span class="font-medium text-slate-800">{{ customerName(job.customer) }}</span>
                </div>
              </td>
              <td>{{ job.projectName || '—' }}</td>
              <td>{{ formatDate(job.date) }}</td>
              <td>{{ job.model || '—' }}</td>
              <td>{{ formatDc(job) }}</td>
              <td>{{ job.pixel || '—' }}</td>
              <td>{{ job.widthMm ?? '—' }}</td>
              <td>{{ job.lengthMm ?? '—' }}</td>
              <td>{{ job.quantity ?? '—' }}</td>
              <td>{{ formatNum(job.totSizeSqFt) }}</td>
              <td>{{ formatRoundedTot(jobRoundedTotSize(job)) }}</td>
              <td>{{ formatNum(job.totSqft) }}</td>
              <td>{{ formatNum(job.pricePerSqft) }}</td>
              <td class="text-emerald-600 font-medium">₹{{ formatNum(job.totalAmount) }}</td>
              <td class="relative">
                <div class="action-menu">
                  <button
                    type="button"
                    class="action-menu-btn"
                    aria-label="Job actions"
                    aria-haspopup="menu"
                    :aria-expanded="openMenuId === job._id"
                    @click="toggleMenu(job._id, $event)"
                  >
                    <Settings :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div ref="loadMoreSentinel" class="py-4 text-center text-sm text-slate-500">
        <span v-if="loadingMore">Loading more...</span>
        <span v-else-if="!hasMore">All jobs loaded</span>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="openMenuId && openJob"
        class="action-dropdown action-dropdown-portal"
        :style="menuStyle"
        role="menu"
      >
        <button type="button" class="action-dropdown-item" role="menuitem" @click="onEdit(openJob)">Edit</button>
        <button type="button" class="action-dropdown-item action-dropdown-item-danger" role="menuitem" @click="onDelete(openJob._id)">Delete</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Search, Settings, FileSpreadsheet } from '@lucide/vue'
import { jobsApi } from '../api/jobs'
import { customersApi } from '../api/customers'
import { modelsApi } from '../api/models'
import SearchableSelect from '../components/SearchableSelect.vue'

import {
  calcJobTotals,
  buildJobPayload,
  calcDcLineAmount,
  calcDcDeliveredQty,
  calcRemainingDeliverQty,
  roundTotSizeSqFt,
} from '../utils/jobCalculations'
import { exportJobsToCsv } from '../utils/exportJobs'

const PAGE_SIZE = 30

const jobs = ref([])
const customersCache = ref([])
const savedModels = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const exporting = ref(false)
const error = ref('')
const totalJobs = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loadMoreSentinel = ref(null)
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const customerFilter = ref('')
const dcFilter = ref('all')
const showModal = ref(false)
const editingId = ref(null)
const editingCustomer = ref(null)
const saving = ref(false)
const formError = ref('')
const openMenuId = ref(null)
const menuStyle = ref({})

const emptyDcItem = () => ({
  date: '',
  billNo: '',
  quantity: '',
})

const emptyForm = () => {
  const date = new Date().toISOString().slice(0, 10)
  return {
    date,
    customer: '',
    projectName: '',
    model: '',
    isDC: false,
    dc: [emptyDcItem()],
    pixel: '',
    jobNumber: '',
    billNo: '',
    quantity: '',
    lengthMm: '',
    widthMm: '',
    pricePerSqft: '',
  }
}

const form = reactive(emptyForm())

const totals = computed(() => calcJobTotals(form))

const totSizeSqFt = computed(() => totals.value.totSizeSqFt)
const roundedTotSizeSqFt = computed(() => totals.value.roundedTotSizeSqFt)
const totSqft = computed(() => totals.value.totSqft)
const totalAmount = computed(() => totals.value.totalAmount)

const deliveredDcQty = computed(() => calcDcDeliveredQty(form.dc))
const remainingDcQty = computed(() => calcRemainingDeliverQty(form.quantity, form.dc))

const jobModelOptions = computed(() => {
  const list = [...savedModels.value]
  if (form.model && !list.some((m) => m.name === form.model)) {
    list.unshift({ _id: `legacy-${form.model}`, name: form.model })
  }
  return list
})

const customerFilterOptions = computed(() =>
  [...customersCache.value].sort((a, b) =>
    customerLabel(a).toLowerCase().localeCompare(customerLabel(b).toLowerCase()),
  ),
)

const customerFilterOptionsList = computed(() => [
  { value: '', label: 'All' },
  ...customerFilterOptions.value.map((c) => ({
    value: c._id,
    label: customerLabel(c),
  })),
])

const hasActiveFilters = computed(() =>
  !!search.value.trim() || !!dateFrom.value || !!dateTo.value || !!customerFilter.value || dcFilter.value !== 'all'
)

const emptyMessage = computed(() => {
  if (!hasActiveFilters.value) return 'No jobs yet. Click "+ Add Job".'
  return 'No jobs match your filters.'
})

const openJob = computed(() => jobs.value.find((j) => j._id === openMenuId.value))

function filterParams() {
  const params = { limit: PAGE_SIZE }
  const q = search.value.trim()
  if (q) params.search = q
  if (dateFrom.value) params.from = dateFrom.value
  if (dateTo.value) params.to = dateTo.value
  if (customerFilter.value) params.customer = customerFilter.value
  if (dcFilter.value === 'yes') params.isDC = 'yes'
  if (dcFilter.value === 'no') params.isDC = 'no'
  return params
}

async function fetchJobs({ reset = false } = {}) {
  if (reset) {
    if (loadingMore.value) return
    loading.value = true
    page.value = 1
    hasMore.value = false
  } else {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  }

  error.value = ''
  try {
    const data = await jobsApi.list({ ...filterParams(), page: page.value })
    const items = data.items || []
    jobs.value = reset ? items : [...jobs.value, ...items]
    totalJobs.value = data.total ?? jobs.value.length
    hasMore.value = !!data.hasMore
    if (hasMore.value) page.value += 1
  } catch (e) {
    error.value = e.message || 'Failed to load jobs'
    if (reset) jobs.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function reloadJobs() {
  fetchJobs({ reset: true })
}

let scrollObserver = null
let filterTimer = null

function setupInfiniteScroll() {
  scrollObserver?.disconnect()
  const root = document.querySelector('main')
  if (!loadMoreSentinel.value || !root) return

  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) fetchJobs()
    },
    { root, rootMargin: '120px', threshold: 0 },
  )
  scrollObserver.observe(loadMoreSentinel.value)
}

watch([search, dateFrom, dateTo, customerFilter, dcFilter], () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(reloadJobs, 300)
})

watch(loading, async (isLoading) => {
  if (!isLoading) {
    await nextTick()
    setupInfiniteScroll()
  }
})

function formatNum(n) {
  const num = Number(n) || 0
  return num ? num.toFixed(2) : '—'
}

function formatRoundedTot(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (Number.isInteger(num)) return String(num)
  return num.toFixed(2).replace(/\.?0+$/, '')
}

function jobRoundedTotSize(job) {
  if (job.roundedTotSizeSqFt != null && job.roundedTotSizeSqFt !== '') {
    return job.roundedTotSizeSqFt
  }
  return roundTotSizeSqFt(job.totSizeSqFt)
}

function customerLabel(c) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ')
}

function customerName(customer) {
  if (!customer) return '—'
  if (typeof customer === 'object') return customerLabel(customer)
  return '—'
}

function customerInitials(customer) {
  const name = customerName(customer)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

function dcLineAmount(item) {
  const amount = calcDcLineAmount(form, item.quantity)
  return amount ? `₹${amount.toFixed(2)}` : '—'
}

function formatDcItem(item, job = null) {
  if (typeof item === 'string') return item
  const amount = job
    ? calcDcLineAmount(job, item.quantity)
    : Number(item.amount) || calcDcLineAmount(form, item.quantity)
  const parts = []
  if (item.date) parts.push(formatDate(item.date))
  if (item.billNo) parts.push(item.billNo)
  if (item.quantity) parts.push(`Qty ${item.quantity}`)
  if (amount) parts.push(`₹${amount.toFixed(2)}`)
  return parts.join(' · ') || '—'
}

function formatDc(job) {
  if (!job.isDC) return '—'
  if (!Array.isArray(job.dc) || !job.dc.length) return 'Yes'
  const lines = job.dc.map((item) => formatDcItem(item, job))
  const remaining = job.remainingDeliverQty ?? calcRemainingDeliverQty(job.quantity, job.dc)
  return `${lines.join('; ')} (Rem: ${remaining})`
}

function normalizeDcFormItems(dc) {
  if (!Array.isArray(dc) || !dc.length) return [emptyDcItem()]
  return dc.map((item) => {
    if (typeof item === 'string') {
      return { date: '', billNo: item, quantity: '' }
    }
    return {
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
      billNo: item.billNo || '',
      quantity: item.quantity ?? '',
    }
  })
}

function onDcToggle() {
  if (form.isDC && !form.dc.length) form.dc.push(emptyDcItem())
  if (!form.isDC) form.dc = [emptyDcItem()]
}

function addDc() {
  form.dc.push(emptyDcItem())
}

function removeDc(index) {
  form.dc.splice(index, 1)
  if (!form.dc.length) form.dc.push(emptyDcItem())
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

function onEdit(job) {
  closeMenu()
  openModal(job)
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

async function exportExcel() {
  if (exporting.value || !totalJobs.value) return
  exporting.value = true
  error.value = ''
  try {
    const data = await jobsApi.listForExport(filterParams())
    const items = data.items || []
    if (!items.length) return
    exportJobsToCsv(items, { customerName })
  } catch (e) {
    error.value = e.message || 'Failed to export jobs'
  } finally {
    exporting.value = false
  }
}

async function loadModelOptions() {
  try {
    savedModels.value = await modelsApi.list()
  } catch {
    savedModels.value = []
  }
}

async function ensureCustomersLoaded() {
  if (!customersCache.value.length) {
    customersCache.value = await customersApi.list()
  }
}

async function loadCustomers({ search: q, page, limit }) {
  await ensureCustomersLoaded()
  const term = q.toLowerCase()
  const filtered = term
    ? customersCache.value.filter((c) => customerLabel(c).toLowerCase().includes(term))
    : customersCache.value
  const start = (page - 1) * limit
  return { items: filtered.slice(start, start + limit), total: filtered.length }
}

function openModal(job = null) {
  formError.value = ''
  loadModelOptions()
  editingId.value = job?._id || null
  editingCustomer.value = job?.customer && typeof job.customer === 'object' ? job.customer : null
  Object.assign(form, job ? {
    date: job.date ? new Date(job.date).toISOString().slice(0, 10) : '',
    customer: job.customer?._id || job.customer || '',
    projectName: job.projectName || '',
    model: job.model || '',
    isDC: !!job.isDC,
    dc: normalizeDcFormItems(job.dc),
    pixel: job.pixel || '',
    jobNumber: job.jobNumber || '',
    billNo: job.billNo || '',
    quantity: job.quantity ?? '',
    lengthMm: job.lengthMm ?? '',
    widthMm: job.widthMm ?? '',
    pricePerSqft: job.pricePerSqft ?? '',
  } : emptyForm())
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  editingCustomer.value = null
}

async function save() {
  formError.value = ''
  if (!form.customer) {
    formError.value = 'Customer is required'
    return
  }
  if (!form.projectName?.trim()) {
    formError.value = 'Project name is required'
    return
  }
  saving.value = true
  try {
    const payload = buildJobPayload(form)
    if (editingId.value) {
      await jobsApi.update(editingId.value, payload)
    } else {
      await jobsApi.create(payload)
    }
    closeModal()
    reloadJobs()
  } catch (e) {
    formError.value = e.message || 'Failed to save job'
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('Delete this job?')) return
  try {
    await jobsApi.delete(id)
    reloadJobs()
  } catch (e) {
    error.value = e.message || 'Failed to delete job'
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  await Promise.all([loadModelOptions(), ensureCustomersLoaded(), fetchJobs({ reset: true })])
  await nextTick()
  setupInfiniteScroll()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  clearTimeout(filterTimer)
  scrollObserver?.disconnect()
})
</script>
