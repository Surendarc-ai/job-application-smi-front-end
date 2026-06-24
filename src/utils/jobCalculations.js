// Length and width are always in millimeters (mm).
// 1 sq ft = 304.8 mm × 304.8 mm = 92903.04 mm²
export const MM2_TO_SQFT = 1 / 92903.04;

// Round up to next whole number only when decimal part is .90 or higher (e.g. 12.90 → 13).
// Values like 12.5 stay as 12.5.
export function roundTotSizeSqFt(value) {
  const num = Number(value) || 0;
  const base = Math.round(num * 10000) / 10000;
  const decimalPart = Math.round((base % 1) * 100);
  if (decimalPart >= 90) {
    return Math.ceil(base - 1e-9);
  }
  return Math.round(base * 100) / 100;
}

export function calcJobTotals({ quantity, lengthMm, widthMm, pricePerSqft }) {
  const q = Number(quantity) || 0;
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  const price = Number(pricePerSqft) || 0;
  const totSizeSqFt = l * w * MM2_TO_SQFT;
  const roundedTotSizeSqFt = roundTotSizeSqFt(totSizeSqFt);
  const totSqft = roundedTotSizeSqFt * q;
  const totalAmount = totSqft * price;
  return {
    totSizeSqFt: Math.round(totSizeSqFt * 10000) / 10000,
    roundedTotSizeSqFt,
    totSqft: Math.round(totSqft * 10000) / 10000,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

export function calcDcLineAmount({ lengthMm, widthMm, pricePerSqft, totSizeSqFt, roundedTotSizeSqFt }, dcQty) {
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  const price = Number(pricePerSqft) || 0;
  const q = Number(dcQty) || 0;
  const rawSize = totSizeSqFt ?? l * w * MM2_TO_SQFT;
  const roundedSize = roundedTotSizeSqFt ?? roundTotSizeSqFt(rawSize);
  return Math.round(roundedSize * q * price * 100) / 100;
}

export function calcDcDeliveredQty(dc) {
  if (!Array.isArray(dc)) return 0;
  return dc.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
}

export function calcRemainingDeliverQty(jobQty, dc) {
  const total = Number(jobQty) || 0;
  return Math.round((total - calcDcDeliveredQty(dc)) * 10000) / 10000;
}

export function normalizeDcItems(dc, jobFields = {}) {
  if (!Array.isArray(dc)) return [];
  return dc
    .map((item) => {
      if (typeof item === 'string') {
        const billNo = item.trim();
        return billNo ? { date: '', billNo, quantity: 0, amount: 0 } : null;
      }
      const quantity = Number(item.quantity) || 0;
      return {
        date: item.date || '',
        billNo: String(item.billNo || '').trim(),
        quantity,
        amount: calcDcLineAmount(jobFields, quantity),
      };
    })
    .filter((item) => item && (item.billNo || item.quantity));
}

export function buildJobPayload(form) {
  const totals = calcJobTotals(form);
  const dcItems = form.isDC ? normalizeDcItems(form.dc, form) : [];
  return {
    date: form.date,
    customer: form.customer,
    projectName: String(form.projectName || '').trim(),
    model: form.model || '',
    isDC: !!form.isDC,
    dc: dcItems,
    remainingDeliverQty: calcRemainingDeliverQty(form.quantity, dcItems),
    pixel: form.pixel || '',
    jobNumber: form.jobNumber || '',
    billNo: form.billNo || '',
    quantity: Number(form.quantity) || 0,
    lengthMm: Number(form.lengthMm) || 0,
    widthMm: Number(form.widthMm) || 0,
    pricePerSqft: Number(form.pricePerSqft) || 0,
    ...totals,
  };
}
