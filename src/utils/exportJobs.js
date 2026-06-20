function escapeCsv(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportJobsToCsv(jobs, { customerName, formatDate, formatDc, formatNum }) {
  const headers = [
    'Customer',
    'Project Name',
    'Date',
    'Model',
    'Multiple DC',
    'Pixel',
    'No',
    'Bill No',
    'Qty',
    'L (mm)',
    'W (mm)',
    'Tot Sqft',
    'Price/Sqft',
    'Total (₹)',
  ]

  const rows = jobs.map((job) => [
    customerName(job.customer),
    job.projectName || '',
    formatDate(job.date),
    job.model || '',
    formatDc(job),
    job.pixel || '',
    job.jobNumber || '',
    job.billNo || '',
    job.quantity ?? '',
    job.lengthMm ?? '',
    job.widthMm ?? '',
    formatNum(job.totSqft),
    formatNum(job.pricePerSqft),
    formatNum(job.totalAmount),
  ])

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
