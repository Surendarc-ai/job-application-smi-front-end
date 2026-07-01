<template>
  <div class="page-card max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-800 m-0 mb-2">Data Backup</h1>
    <p class="text-sm text-slate-500 mb-6">
      Download all data to Excel. If data is corrupted, upload the same backup file to restore it.
    </p>

    <div class="space-y-5">
      <section class="border border-slate-200 rounded-xl p-5">
        <h2 class="text-base font-semibold text-slate-800 m-0 mb-2">Download Backup</h2>
        <p class="text-sm text-slate-500 mb-4">
          Creates an Excel file with sheets: Companies, Customers, Items, Jobs, Product_Models, Roles, and Users.
        </p>
        <button
          type="button"
          class="btn-primary flex items-center gap-2"
          :disabled="exporting"
          @click="downloadBackup"
        >
          <Download :size="16" />
          {{ exporting ? 'Preparing backup...' : 'Download Excel Backup' }}
        </button>
        <p v-if="exportCounts" class="success-msg mt-3 mb-0">
          Exported {{ exportCounts.companies ?? 0 }} companies, {{ exportCounts.customers ?? 0 }} customers,
          {{ exportCounts.items ?? 0 }} items, {{ exportCounts.jobs ?? 0 }} jobs,
          {{ exportCounts.product_models ?? 0 }} product models, {{ exportCounts.roles ?? 0 }} roles,
          {{ exportCounts.users ?? 0 }} users.
        </p>
      </section>

      <section class="border border-slate-200 rounded-xl p-5">
        <h2 class="text-base font-semibold text-slate-800 m-0 mb-2">Email Backup</h2>
        <p v-if="emailStatus?.configured" class="text-sm text-slate-500 mb-4">
          Send the Excel backup to
          <span class="font-medium text-slate-700">{{ emailStatus.recipients.join(', ') }}</span>.
          A daily cron can also email backups automatically.
        </p>
        <p v-else class="text-sm text-amber-700 mb-4">
          Email is not configured on the server. Set BACKUP_EMAIL_TO and SMTP settings in the backend env file.
        </p>
        <button
          type="button"
          class="btn-secondary flex items-center gap-2"
          :disabled="!emailStatus?.configured || emailing"
          @click="emailBackup"
        >
          <Mail :size="16" />
          {{ emailing ? 'Sending backup...' : 'Email Backup Now' }}
        </button>
        <p v-if="emailError" class="error-msg mt-3 mb-0">{{ emailError }}</p>
        <p v-if="emailMessage" class="success-msg mt-3 mb-0">{{ emailMessage }}</p>
      </section>

      <section class="border border-slate-200 rounded-xl p-5">
        <h2 class="text-base font-semibold text-slate-800 m-0 mb-2">Restore Backup</h2>
        <p class="text-sm text-slate-500 mb-4">
          Upload a backup Excel file. Existing records with the same ID will be updated. New records will be added.
        </p>

        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          class="hidden"
          @change="onFileSelected"
        />

        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn-secondary flex items-center gap-2" :disabled="restoring" @click="pickFile">
            <Upload :size="16" />
            Choose Excel File
          </button>
          <span v-if="selectedFile" class="text-sm text-slate-600">{{ selectedFile.name }}</span>
        </div>

        <label class="inline-flex items-center gap-2 mt-4 text-sm text-slate-700 cursor-pointer select-none">
          <input v-model="confirmRestore" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
          I understand this will update my company data from the uploaded file.
        </label>

        <button
          type="button"
          class="btn-primary mt-4 flex items-center gap-2"
          :disabled="!selectedFile || !confirmRestore || restoring"
          @click="restoreBackup"
        >
          <Upload :size="16" />
          {{ restoring ? 'Restoring...' : 'Upload & Restore' }}
        </button>

        <p v-if="restoreError" class="error-msg mt-3">{{ restoreError }}</p>
        <p v-if="restoreMessage" class="success-msg mt-3">{{ restoreMessage }}</p>

        <div v-if="restoreStats" class="mt-3 text-sm text-slate-600 space-y-1">
          <p>Customers restored: {{ restoreStats.customers.restored }} (skipped: {{ restoreStats.customers.skipped }})</p>
          <p>Models restored: {{ restoreStats.models.restored }} (skipped: {{ restoreStats.models.skipped }})</p>
          <p>Jobs restored: {{ restoreStats.jobs.restored }} (skipped: {{ restoreStats.jobs.skipped }})</p>
          <ul v-if="restoreStats.errors?.length" class="error-msg mt-2 pl-4 list-disc">
            <li v-for="(err, index) in restoreStats.errors.slice(0, 10)" :key="index">{{ err }}</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Download, Mail, Upload } from '@lucide/vue'
import { backupApi } from '../api/backup'

const exporting = ref(false)
const emailing = ref(false)
const restoring = ref(false)
const exportCounts = ref(null)
const emailStatus = ref(null)
const emailMessage = ref('')
const emailError = ref('')
const selectedFile = ref(null)
const confirmRestore = ref(false)
const restoreError = ref('')
const restoreMessage = ref('')
const restoreStats = ref(null)
const fileInput = ref(null)

onMounted(async () => {
  try {
    emailStatus.value = await backupApi.getEmailStatus()
  } catch {
    emailStatus.value = { configured: false, recipients: [] }
  }
})

async function downloadBackup() {
  exporting.value = true
  exportCounts.value = null
  try {
    exportCounts.value = await backupApi.exportExcel()
  } catch (e) {
    exportCounts.value = null
    alert(e.message || 'Failed to export backup')
  } finally {
    exporting.value = false
  }
}

async function emailBackup() {
  emailing.value = true
  emailMessage.value = ''
  emailError.value = ''
  try {
    const result = await backupApi.emailBackup()
    emailMessage.value = result.message || 'Backup emailed successfully'
  } catch (e) {
    emailError.value = e.message || 'Failed to email backup'
  } finally {
    emailing.value = false
  }
}

function pickFile() {
  fileInput.value?.click()
}

function onFileSelected(event) {
  const file = event.target.files?.[0]
  selectedFile.value = file || null
  restoreError.value = ''
  restoreMessage.value = ''
  restoreStats.value = null
}

async function restoreBackup() {
  if (!selectedFile.value || !confirmRestore.value) return
  restoring.value = true
  restoreError.value = ''
  restoreMessage.value = ''
  restoreStats.value = null
  try {
    const result = await backupApi.restoreExcel(selectedFile.value)
    restoreMessage.value = result.message || 'Backup restored successfully'
    restoreStats.value = result.stats || null
    selectedFile.value = null
    confirmRestore.value = false
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    restoreError.value = e.message || 'Failed to restore backup'
  } finally {
    restoring.value = false
  }
}
</script>
