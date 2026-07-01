import ExcelJS from 'exceljs'
import {
  calcDcDeliveredQty,
  calcRemainingDeliverQty,
  calcDcLineAmount,
} from './jobCalculations'

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

function dcAmountTotal(job, items) {
  return items.reduce((sum, item) => sum + (Number(dcAmount(job, item)) || 0), 0)
}

function customerKey(job) {
  const c = job.customer
  if (c && typeof c === 'object' && c._id) return String(c._id)
  if (c) return String(c)
  return ''
}

const EXPORT_COLUMN_COUNT = 14
const GROUP_SPACER_ROWS = 2
const TAX_RATE = 0.18

function calcTax(amount) {
  const num = Number(amount) || 0
  return num ? Math.round(num * TAX_RATE * 100) / 100 : 0
}

function calcTotalWithTax(amount) {
  const num = Number(amount) || 0
  return num ? Math.round(num * (1 + TAX_RATE) * 100) / 100 : 0
}

function formatAmountCells(amount) {
  const num = Number(amount) || 0
  if (!num) return ['', '', '']
  return [formatAmount(num), formatAmount(calcTax(num)), formatAmount(calcTotalWithTax(num))]
}

function emptyRow() {
  return Array(EXPORT_COLUMN_COUNT).fill('')
}

function addGroupSpacer(rows) {
  for (let i = 0; i < GROUP_SPACER_ROWS; i++) {
    rows.push(emptyRow())
  }
}

function buildExportGroupKey(job) {
  return [
    customerKey(job),
    formatExportDate(job.date),
    job.projectName || '',
    job.widthMm ?? '',
    job.lengthMm ?? '',
    Number(job.quantity) || 0,
  ].join('::')
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
  let lastGroupKey = null
  let customerRowId = 0
  let customerRowShown = false
  const sortedJobs = sortJobsForExport(jobs, customerName)

  for (const job of sortedJobs) {
    const key = customerKey(job)
    const groupKey = buildExportGroupKey(job)

    if (rows.length > 0 && groupKey !== lastGroupKey) {
      addGroupSpacer(rows)
    }
    lastGroupKey = groupKey

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
    const deliveredTotal = job.isDC ? calcDcDeliveredQty(job.dc) : 0
    const remaining = job.isDC
      ? (job.remainingDeliverQty ?? calcRemainingDeliverQty(job.quantity, job.dc))
      : totalQty
    const items = dcItems(job)
    const { id, name } = takeCustomerCells()
    const pixel = job.pixel || ''

    rows.push([
      id,
      name,
      formatExportDate(job.date),
      job.projectName || '',
      pixel,
      width,
      height,
      totalQty,
      job.billNo || '',
      items.length ? '' : deliveredTotal,
      remaining,
      '',
      '',
      '',
    ])

    for (const item of items) {
      const [amount, tax, totalAmount] = formatAmountCells(dcAmount(job, item))
      rows.push([
        '',
        '',
        dcLineDate(item),
        '',
        '',
        '',
        '',
        '',
        dcBillNo(item),
        dcQty(item),
        '',
        amount,
        tax,
        totalAmount,
      ])
    }

    if (items.length > 0) {
      const [amount, tax, totalAmount] = formatAmountCells(dcAmountTotal(job, items))
      rows.push([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Total',
        deliveredTotal,
        '',
        amount,
        tax,
        totalAmount,
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
  'Tax 18%',
  'Total Amount',
]

export async function exportJobsToExcel(jobs, { customerName, includeHeaders = true }) {
  const rows = buildJobExportRows(jobs, { customerName })
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Jobs')

  if (includeHeaders) {
    const headerRow = sheet.addRow(EXPORT_HEADERS)
    headerRow.font = { bold: true }
  }

  const billColIndex = EXPORT_HEADERS.indexOf('Bill') + 1

  for (const row of rows) {
    const added = sheet.addRow(row)
    if (row[billColIndex - 1] === 'Total') {
      added.eachCell((cell) => {
        cell.font = { bold: true }
      })
    }
  }

  sheet.columns.forEach((column) => {
    column.width = 14
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `jobs-export-${new Date().toISOString().slice(0, 10)}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
