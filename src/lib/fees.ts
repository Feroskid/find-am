// Find-task fee formula:
//   Service fee = 10% of budget
//   Fixed fee   = ₦100
//   VAT         = 7.5% of service fee only
//   Employer pays = budget + service fee + fixed fee + VAT
//   Tasker receives the full budget.
export interface FeeBreakdown {
  budget: number;
  serviceFee: number;
  fixedFee: number;
  vat: number;
  total: number;
  taskerReceives: number;
}

export const MIN_TASK_BUDGET = 2000;
export const FIXED_FEE = 100;
export const SERVICE_FEE_RATE = 0.10;
export const VAT_RATE = 0.075;

export function computeFees(budget: number): FeeBreakdown {
  const b = Number.isFinite(budget) && budget > 0 ? budget : 0;
  const serviceFee = Math.round(b * SERVICE_FEE_RATE);
  const fixedFee = FIXED_FEE;
  const vat = Math.round(serviceFee * VAT_RATE);
  const total = b + serviceFee + fixedFee + vat;
  return { budget: b, serviceFee, fixedFee, vat, total, taskerReceives: b };
}

export const formatNaira = (n: number) =>
  `₦${Math.round(n).toLocaleString()}`;
