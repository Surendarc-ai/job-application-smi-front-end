const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'jobapp_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export const backupApi = {
  async exportExcel() {
    const token = getToken()
    const url = `${BASE}/api/backup/export`
    const res = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || res.statusText)
    }

    const blob = await res.blob()
    const countsHeader = res.headers.get('X-Backup-Counts')
    const counts = countsHeader ? JSON.parse(countsHeader) : null
    const date = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `job-app-backup-${date}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    return counts
  },

  async getEmailStatus() {
    const token = getToken()
    const url = `${BASE}/api/backup/email/status`
    const res = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || res.statusText)
    return data
  },

  async emailBackup() {
    const token = getToken()
    const url = `${BASE}/api/backup/email`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || res.statusText)
    return data
  },

  async restoreExcel(file) {
    const token = getToken()
    const fileBase64 = await readFileAsBase64(file)
    const url = `${BASE}/api/backup/restore`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ fileBase64 }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || res.statusText)
    return data
  },
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
