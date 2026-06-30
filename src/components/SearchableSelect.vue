<template>
  <div ref="rootRef" class="relative w-full">
    <button type="button" class="select-field w-full flex items-center justify-between gap-2 text-left cursor-pointer" @click="toggleOpen">
      <span class="truncate" :class="displayLabel ? 'text-slate-800' : 'text-slate-400'">{{ displayLabel || placeholder }}</span>
      <ChevronDown :size="16" class="shrink-0 text-slate-400" />
    </button>
    <div v-if="open" class="absolute z-[60] left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
      <div class="p-2 border-b border-slate-100">
        <input ref="searchInputRef" v-model="search" type="text" :placeholder="searchPlaceholder" class="input-field" @keydown.escape.prevent="close" />
      </div>
      <ul class="max-h-56 overflow-y-auto py-1">
        <li v-if="loading" class="px-3 py-2 text-sm text-slate-500">Loading...</li>
        <li v-for="opt in visibleOptions" :key="String(opt.value)" class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 whitespace-normal break-words" :class="{ 'bg-blue-50 text-blue-700 font-medium': isSelected(opt.value) }" @click="selectOption(opt)">{{ opt.label }}</li>
        <li v-if="!loading && visibleOptions.length === 0" class="px-3 py-2 text-sm text-slate-500">No results found</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: 'Select...' },
  searchPlaceholder: { type: String, default: 'Search...' },
  options: { type: Array, default: () => [] },
  loadOptions: { type: Function, default: null },
  optionValue: { type: String, default: '_id' },
  optionLabel: { type: [String, Function], default: '' },
  initialOption: { type: Object, default: null },
  pageSize: { type: Number, default: 30 },
})
const emit = defineEmits(['update:modelValue'])
const rootRef = ref(null)
const searchInputRef = ref(null)
const open = ref(false)
const search = ref('')
const asyncOptions = ref([])
const selectedOption = ref(null)
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const isAsync = computed(() => typeof props.loadOptions === 'function')
const visibleOptions = computed(() => isAsync.value ? asyncOptions.value.map(normalizeOption) : filteredStaticOptions.value)
const filteredStaticOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  const opts = props.options.map(normalizeOption)
  return q ? opts.filter((opt) => opt.label.toLowerCase().includes(q)) : opts
})
const displayLabel = computed(() => selectedOption.value?.label || visibleOptions.value.find((opt) => isSelected(opt.value))?.label || '')
function normalizeOption(item) {
  if (item && typeof item === 'object' && 'value' in item && 'label' in item) return { value: item.value, label: String(item.label), raw: item }
  if (item && typeof item === 'object') {
    const value = props.optionValue ? item[props.optionValue] : item.value
    let label = String(value ?? '')
    if (typeof props.optionLabel === 'function') label = props.optionLabel(item)
    else if (props.optionLabel) label = String(item[props.optionLabel] ?? value ?? '')
    return { value, label, raw: item }
  }
  return { value: item, label: String(item), raw: item }
}
function isSelected(value) { return String(value) === String(props.modelValue) }
function syncSelectedFromValue() {
  if (props.modelValue === '' || props.modelValue == null) {
    const emptyOption = visibleOptions.value.find((opt) => opt.value === '' || opt.value == null)
    selectedOption.value = emptyOption || null
    return
  }
  const found = visibleOptions.value.find((opt) => isSelected(opt.value)) || (props.initialOption ? normalizeOption(props.initialOption) : null)
  selectedOption.value = found
}
async function fetchAsyncOptions(reset = false) {
  if (!isAsync.value) return
  if (reset) { page.value = 1; loading.value = true }
  try {
    const { items, total: totalCount } = await props.loadOptions({ search: search.value.trim(), page: page.value, limit: props.pageSize })
    asyncOptions.value = reset ? items : [...asyncOptions.value, ...items]
    total.value = totalCount
    page.value += 1
    syncSelectedFromValue()
  } finally { loading.value = false }
}
function toggleOpen() {
  open.value = !open.value
  if (open.value) { nextTick(() => searchInputRef.value?.focus()); if (isAsync.value && asyncOptions.value.length === 0) fetchAsyncOptions(true) }
}
function close() { open.value = false; search.value = '' }
function selectOption(opt) { selectedOption.value = opt; emit('update:modelValue', opt.value); close() }
function onDocumentClick(e) { if (rootRef.value && !rootRef.value.contains(e.target)) close() }
watch(search, () => { if (open.value && isAsync.value) fetchAsyncOptions(true) })
watch(() => props.modelValue, syncSelectedFromValue)
watch(() => props.options, syncSelectedFromValue, { deep: true })
watch(() => props.initialOption, syncSelectedFromValue, { immediate: true })
onMounted(() => { document.addEventListener('click', onDocumentClick); syncSelectedFromValue() })
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>
