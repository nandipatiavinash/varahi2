/**
 * Shared billing math used by BOTH the live billing form (for the on-screen
 * preview) and the createBill/updateBill Server Actions (source of truth on
 * save). Keeping this in one module guarantees the number the owner sees
 * while billing is exactly the number that gets stored — no drift.
 */

export interface BillLineInput {
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface LineCalculation {
  lineTotal: number;
  lineProfit: number;
}

export function calculateLine(line: BillLineInput): LineCalculation {
  const lineTotal = round2(line.sellingPrice * line.quantity);
  const lineProfit = round2((line.sellingPrice - line.purchasePrice) * line.quantity);
  return { lineTotal, lineProfit };
}

export interface BillCalculationInput {
  items: BillLineInput[];
  discount: number;
  /** If provided, this overrides the computed grand total (negotiated price). */
  grandTotalOverride?: number | null;
}

export interface BillCalculation {
  subtotal: number;
  grossProfit: number;
  computedGrandTotal: number;
  grandTotal: number;
}

export function calculateBill(input: BillCalculationInput): BillCalculation {
  let subtotal = 0;
  let grossProfit = 0;

  for (const item of input.items) {
    const { lineTotal, lineProfit } = calculateLine(item);
    subtotal += lineTotal;
    grossProfit += lineProfit;
  }

  subtotal = round2(subtotal);
  grossProfit = round2(grossProfit);

  const computedGrandTotal = round2(subtotal - (input.discount || 0));
  const grandTotal =
    input.grandTotalOverride !== undefined && input.grandTotalOverride !== null
      ? round2(input.grandTotalOverride)
      : computedGrandTotal;

  return { subtotal, grossProfit, computedGrandTotal, grandTotal };
}

export function calculatePaidAmount(splits: { method: string; amount: number }[]): number {
  return round2(
    splits
      .filter((s) => s.method !== "credit")
      .reduce((sum, s) => sum + s.amount, 0)
  );
}

export function deriveBillStatus(grandTotal: number, paidAmount: number): "paid" | "partial" | "credit" {
  if (paidAmount <= 0) return "credit";
  if (paidAmount >= grandTotal) return "paid";
  return "partial";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
