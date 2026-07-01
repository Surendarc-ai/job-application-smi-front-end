// Length and width are always in millimeters (mm).
// 1 sq ft = 304.8 mm × 304.8 mm = 92903.04 mm²
export const MM2_TO_SQFT = 1 / 92903.04;

// Round up to next whole number when decimal part is .5 or higher (e.g. 11.5 → 12).
// Below .5 keep the value as is (e.g. 11.4 stays 11.4).
export function roundTotSizeSqFt(value) {
  const num = Number(value) || 0;
  const base = Math.round(num * 10000) / 10000;
  const fractional = base - Math.floor(base);
  if (fractional >= 0.5) {
    return Math.ceil(base - 1e-9);
  }
  return Math.round(base * 100) / 100;
}

// Round up when decimal part is .8 or higher (e.g. 11.8, 11.9 → 12). Below .8 keep as is.
export function roundTotalAmount(value) {
  const num = Number(value) || 0;
  const base = Math.round(num * 10000) / 10000;
  const fractional = base - Math.floor(base);
  if (fractional >= 0.8) {
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
  const totalAmount = roundTotalAmount(totSqft * price);
  return {
    totSizeSqFt: Math.round(totSizeSqFt * 10000) / 10000,
    roundedTotSizeSqFt,
    totSqft: Math.round(totSqft * 10000) / 10000,
    totalAmount,
  };
}

export function calcDcLineAmount({ lengthMm, widthMm, pricePerSqft, totSizeSqFt, roundedTotSizeSqFt }, dcQty) {
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  const price = Number(pricePerSqft) || 0;
  const q = Number(dcQty) || 0;
  const rawSize = totSizeSqFt ?? l * w * MM2_TO_SQFT;
  const roundedSize = roundedTotSizeSqFt ?? roundTotSizeSqFt(rawSize);
  return roundTotalAmount(roundedSize * q * price);
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
      const calculated = calcDcLineAmount(jobFields, quantity);
      const amount = item.amount !== '' && item.amount != null
        ? roundTotalAmount(item.amount)
        : calculated;
      return {
        date: item.date || '',
        billNo: String(item.billNo || '').trim(),
        quantity,
        amount,
      };
    })
    .filter((item) => item && (item.billNo || item.quantity));
}

export function buildJobPayload(form) {
  const totals = calcJobTotals(form);
  const dcItems = form.isDC ? normalizeDcItems(form.dc, form) : [];
  const totalAmount = form.totalAmount !== '' && form.totalAmount != null
    ? roundTotalAmount(form.totalAmount)
    : totals.totalAmount;
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
    totalAmount,
  };
}
