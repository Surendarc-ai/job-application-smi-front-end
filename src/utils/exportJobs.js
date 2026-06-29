import {
  calcDcDeliveredQty,
  calcRemainingDeliverQty,
  calcDcLineAmount,
} from './jobCalculations'

function escapeCsv(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function parseExportDate(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function formatExportDate(d) {
  const date = parseExportDate(d)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatAmount(n) {
  const num = Number(n) || 0
  return num ? num.toFixed(2) : ''
}

function dcItems(job) {
  if (!job.isDC || !Array.isArray(job.dc)) return []
  return job.dc.filter((item) => {
    if (typeof item === 'string') return item.trim()
    return item?.billNo || Number(item?.quantity)
  })
}

function dcQty(item) {
  if (typeof item === 'string') return ''
  return item?.quantity ?? ''
}

function dcBillNo(item) {
  if (typeof item === 'string') return item.trim()
  return item?.billNo || ''
}

function dcLineDate(item) {
  if (typeof item === 'object' && item?.date) return formatExportDate(item.date)
  return ''
}

function dcAmount(job, item) {
  if (typeof item === 'object' && item?.amount) return item.amount
  return calcDcLineAmount(job, dcQty(item))
}

function customerKey(job) {
  const c = job.customer
  if (c && typeof c === 'object' && c._id) return String(c._id)
  if (c) return String(c)
  return ''
}

const EXPORT_COLUMN_COUNT = 12
const PROJECT_SPACER_ROWS = 2

function emptyRow() {
  return Array(EXPORT_COLUMN_COUNT).fill('')
}

function addProjectSpacer(rows) {
  for (let i = 0; i < PROJECT_SPACER_ROWS; i++) {
    rows.push(emptyRow())
  }
}

function sortJobsForExport(jobs, customerName) {
  return [...jobs].sort((a, b) => {
    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0)
    if (dateDiff !== 0) return dateDiff
    const nameA = customerName(a.customer).toLowerCase()
    const nameB = customerName(b.customer).toLowerCase()
    if (nameA !== nameB) return nameA.localeCompare(nameB)
    const projectA = (a.projectName || '').toLowerCase()
    const projectB = (b.projectName || '').toLowerCase()
    return projectA.localeCompare(projectB)
  })
}

export function buildJobExportRows(jobs, { customerName }) {
  const rows = []
  let lastCustomerKey = null
  let lastProjectKey = null
  let customerRowId = 0
  let customerRowShown = false
  const sortedJobs = sortJobsForExport(jobs, customerName)

  for (const job of sortedJobs) {
    const key = customerKey(job)
    const project = job.projectName || ''
    const projectKey = `${key}::${project}`

    if (rows.length > 0 && projectKey !== lastProjectKey) {
      addProjectSpacer(rows)
    }
    lastProjectKey = projectKey

    if (key !== lastCustomerKey) {
      lastCustomerKey = key
      customerRowId += 1
      customerRowShown = false
    }

    const takeCustomerCells = () => {
      if (customerRowShown) return { id: '', name: '' }
      customerRowShown = true
      return { id: String(customerRowId), name: customerName(job.customer) }
    }

    const width = job.widthMm ?? ''
    const height = job.lengthMm ?? ''
    const totalQty = Number(job.quantity) || 0
    const delivered = job.isDC ? calcDcDeliveredQty(job.dc) : 0
    const remaining = job.isDC
      ? (job.remainingDeliverQty ?? calcRemainingDeliverQty(job.quantity, job.dc))
      : totalQty
    const items = dcItems(job)
    const { id, name } = takeCustomerCells()
    const pixel = job.pixel || ''

    // Main job row
    rows.push([
      id,
      name,
      formatExportDate(job.date),
      project,
      pixel,
      width,      
      height,
      totalQty,
      job.billNo || '',
      delivered,
      remaining,
      formatAmount(job.totalAmount),
    ])

    // DC sub-rows: date, bill, qty, amount
    for (const item of items) {
      rows.push([
        '',
        '',
        dcLineDate(item),
        '',
        '',
        '',
        '',
        dcQty(item),
        dcBillNo(item),
        '',
        '',
        formatAmount(dcAmount(job, item)),
      ])
    }
  }

  return rows
}

export const EXPORT_HEADERS = [
  'No.',
  'Customer Name',
  'Job Date',
  'Project Name',
  'Pixel',
  'W',
  'H',
  'Qty',
  'Bill',
  'Delivered',
  'Remaining',
  'Amount',
]

export function exportJobsToCsv(jobs, { customerName, includeHeaders = true }) {
  const rows = buildJobExportRows(jobs, { customerName })
  const allRows = includeHeaders ? [EXPORT_HEADERS, ...rows] : rows

  const csv = allRows
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `jobs-export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
