// Length and width are always in millimeters (mm).
// 1 sq ft = 304.8 mm × 304.8 mm = 92903.04 mm²
export const MM2_TO_SQFT = 1 / 92903.04;

export function calcJobTotals({ quantity, lengthMm, widthMm, pricePerSqft }) {
  const q = Number(quantity) || 0;
  const l = Number(lengthMm) || 0;
  const w = Number(widthMm) || 0;
  const price = Number(pricePerSqft) || 0;
  const totSizeSqFt = l * w * MM2_TO_SQFT;
  const totSqft = totSizeSqFt * q;
  const totalAmount = totSqft * price;
  return {
    totSizeSqFt: Math.round(totSizeSqFt * 10000) / 10000,
    totSqft: Math.round(totSqft * 10000) / 10000,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

export function buildJobPayload(form) {
  const totals = calcJobTotals(form);
  return {
    date: form.date,
    customer: form.customer,
    projectName: String(form.projectName || '').trim(),
    model: form.model || '',
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
