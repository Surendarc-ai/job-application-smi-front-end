import { calcDcDeliveredQty, calcRemainingDeliverQty } from './jobCalculations'

function escapeCsv(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function dcItems(job) {
  if (!job.isDC || !Array.isArray(job.dc)) return []
  return job.dc.filter((item) => {
    if (typeof item === 'string') return item.trim()
    return item?.billNo || Number(item?.quantity)
  })
}

function dcBillNo(item) {
  if (typeof item === 'string') return item.trim()
  return item?.billNo || ''
}

function dcQty(item) {
  if (typeof item === 'string') return ''
  return item?.quantity ?? ''
}

function dcDate(item, formatDate) {
  if (typeof item === 'object' && item?.date) return formatDate(item.date)
  return ''
}

function customerKey(job) {
  const c = job.customer
  if (c && typeof c === 'object' && c._id) return String(c._id)
  if (c) return String(c)
  return ''
}

function sortJobsForExport(jobs, customerName) {
  return [...jobs].sort((a, b) => {
    const nameA = customerName(a.customer).toLowerCase()
    const nameB = customerName(b.customer).toLowerCase()
    if (nameA !== nameB) return nameA.localeCompare(nameB)
    return new Date(b.date || 0) - new Date(a.date || 0)
  })
}

export function buildJobExportRows(jobs, { customerName, formatDate }) {
  const rows = []
  let lastCustomerKey = null
  const sortedJobs = sortJobsForExport(jobs, customerName)

  for (const job of sortedJobs) {
    const key = customerKey(job)
    const showCustomer = key !== lastCustomerKey
    if (showCustomer) lastCustomerKey = key

    const customerLabel = showCustomer ? customerName(job.customer) : ''
    const project = job.projectName || ''
    const jobDate = formatDate(job.date)
    const totalQty = Number(job.quantity) || 0
    const delivered = calcDcDeliveredQty(job.dc)
    const remaining = job.remainingDeliverQty ?? calcRemainingDeliverQty(job.quantity, job.dc)
    const items = dcItems(job)

    if (items.length) {
      items.forEach((item, index) => {
        const isFirstLine = index === 0
        rows.push([
          isFirstLine ? customerLabel : '',
          isFirstLine ? project : '',
          dcDate(item, formatDate),
          dcBillNo(item),
          dcQty(item),
          isFirstLine ? totalQty : '',
          isFirstLine ? delivered : '',
          isFirstLine ? remaining : '',
        ])
      })
      continue
    }

    rows.push([
      customerLabel,
      project,
      jobDate,
      job.billNo || '',
      totalQty,
      totalQty,
      job.isDC ? delivered : 0,
      job.isDC ? remaining : totalQty,
    ])
  }

  return rows
}

export function exportJobsToCsv(jobs, { customerName, formatDate }) {
  const headers = [
    'Customer',
    'Project Name',
    'Date',
    'Bill No',
    'Qty',
    'Total Qty',
    'Delivered',
    'Remaining',
  ]

  const rows = buildJobExportRows(jobs, { customerName, formatDate })

  const csv = [headers, ...rows]
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
