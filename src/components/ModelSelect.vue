<template>
  <div ref="rootRef" class="relative w-full">
    <button
      type="button"
      class="select-field w-full flex items-center justify-between gap-2 text-left cursor-pointer"
      @click="toggleOpen"
    >
      <span class="truncate" :class="displayLabel ? 'text-slate-800' : 'text-slate-400'">
        {{ displayLabel || placeholder }}
      </span>
      <ChevronDown :size="16" class="shrink-0 text-slate-400" />
    </button>
    <div v-if="open" class="absolute z-[60] left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
      <div class="p-2 border-b border-slate-100">
        <input ref="searchInputRef" v-model="search" type="text" :placeholder="searchPlaceholder" class="input-field" @keydown.escape.prevent="close" @keydown.enter.prevent="selectCreate" />
      </div>
      <ul class="max-h-56 overflow-y-auto py-1">
        <li v-for="opt in filteredOptions" :key="opt" class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50" :class="{ 'bg-orange-50 text-orange-700 font-medium': isSelected(opt) }" @click="select(opt)">{{ opt }}</li>
        <li v-if="creatable && search.trim() && !exactMatch" class="px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 text-orange-700 font-medium" @click="selectCreate">Add "{{ search.trim() }}"</li>
        <li v-if="filteredOptions.length === 0 && !(creatable && search.trim())" class="px-3 py-2 text-sm text-slate-500">No results found</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Select...' },
  searchPlaceholder: { type: String, default: 'Type to search or add new...' },
  options: { type: Array, default: () => [] },
  creatable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'create'])
const rootRef = ref(null)
const searchInputRef = ref(null)
const open = ref(false)
const search = ref('')
const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((opt) => opt.toLowerCase().includes(q))
})
const exactMatch = computed(() => props.options.some((opt) => opt.toLowerCase() === search.value.trim().toLowerCase()))
const displayLabel = computed(() => props.modelValue || '')
function isSelected(opt) { return opt === props.modelValue }
function toggleOpen() { open.value = !open.value; if (open.value) { search.value = ''; nextTick(() => searchInputRef.value?.focus()) } }
function close() { open.value = false; search.value = '' }
function select(value) { emit('update:modelValue', value); close() }
function selectCreate() { const value = search.value.trim(); if (!value) return; emit('update:modelValue', value); emit('create', value); close() }
function onDocumentClick(e) { if (rootRef.value && !rootRef.value.contains(e.target)) close() }
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>
