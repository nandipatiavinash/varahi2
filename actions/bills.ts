"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { billSchema } from "@/lib/validations/bill";
import {
  calculateBill,
  calculatePaidAmount,
  deriveBillStatus,
} from "@/lib/billing/calculate";
import { isSameDay } from "@/lib/utils";

export async function listBills(filters?: { from?: string; to?: string; search?: string }) {
  const { supabase, business } = await getCurrentBusiness();
  let query = supabase
    .from("bills")
    .select("*, employees(name)")
    .eq("business_id", business.id)
    .order("bill_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.from) query = query.gte("bill_date", filters.from);
  if (filters?.to) query = query.lte("bill_date", filters.to);
  if (filters?.search) {
    query = query.or(
      `bill_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getBill(id: string) {
  const { supabase, business } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("bills")
    .select("*, employees(name), bill_items(*), payment_splits(*)")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function suggestNextBillNumber() {
  const { supabase, business } = await getCurrentBusiness();
  const { data } = await supabase
    .from("bills")
    .select("bill_number")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.bill_number) return "INV-1001";

  const match = data.bill_number.match(/(\d+)$/);
  if (!match || match[1] === undefined) return data.bill_number + "-1";

  const digits = match[1];
  const nextNum = String(Number(digits) + 1).padStart(digits.length, "0");
  return data.bill_number.slice(0, match.index) + nextNum;
}

export async function checkDuplicateBillNumber(billNumber: string, excludeId?: string) {
  const { supabase, business } = await getCurrentBusiness();
  let query = supabase
    .from("bills")
    .select("id")
    .eq("business_id", business.id)
    .eq("bill_number", billNumber);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query.limit(1);
  return Boolean(data && data.length > 0);
}

export async function createBill(input: unknown) {
  const parsed = billSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const calc = calculateBill({
    items: parsed.items.map((i) => ({
      quantity: i.quantity,
      purchasePrice: i.purchase_price,
      sellingPrice: i.selling_price,
    })),
    discount: parsed.discount,
    grandTotalOverride: parsed.grand_total_override,
  });

  const paidAmount = calculatePaidAmount(parsed.payment_splits);
  const status = deriveBillStatus(calc.grandTotal, paidAmount);

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      business_id: business.id,
      bill_number: parsed.bill_number,
      bill_date: parsed.bill_date,
      customer_name: parsed.customer_name,
      customer_mobile: parsed.customer_mobile || null,
      employee_id: parsed.employee_id || null,
      subtotal: calc.subtotal,
      discount: parsed.discount,
      grand_total: calc.grandTotal,
      gross_profit: calc.grossProfit,
      paid_amount: paidAmount,
      status,
      notes: parsed.notes || null,
    })
    .select("id")
    .single();

  if (billError || !bill) return { error: billError?.message ?? "Failed to create bill." };

  const { error: itemsError } = await supabase.from("bill_items").insert(
    parsed.items.map((item) => ({
      bill_id: bill.id,
      product_id: item.product_id || null,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
    }))
  );

  if (itemsError) return { error: itemsError.message };

  const { error: splitsError } = await supabase.from("payment_splits").insert(
    parsed.payment_splits
      .filter((s) => s.amount > 0)
      .map((split) => ({ bill_id: bill.id, method: split.method, amount: split.amount }))
  );

  if (splitsError) return { error: splitsError.message };

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/credit-customers");
  return { success: true, id: bill.id as string };
}

/**
 * Bills can only be edited on the same calendar day they were created.
 * The database trigger enforces this as the ultimate source of truth;
 * this pre-check exists purely to return a clean, actionable error message
 * to the UI instead of a raw Postgres exception.
 */
export async function updateBill(id: string, input: unknown) {
  const parsed = billSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { data: existing, error: fetchError } = await supabase
    .from("bills")
    .select("created_at, locked")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (fetchError || !existing) return { error: "Bill not found." };
  if (existing.locked || !isSameDay(existing.created_at)) {
    return { error: "This bill can no longer be edited — it was created on a previous day. You can void it instead." };
  }

  const calc = calculateBill({
    items: parsed.items.map((i) => ({
      quantity: i.quantity,
      purchasePrice: i.purchase_price,
      sellingPrice: i.selling_price,
    })),
    discount: parsed.discount,
    grandTotalOverride: parsed.grand_total_override,
  });

  const paidAmount = calculatePaidAmount(parsed.payment_splits);
  const status = deriveBillStatus(calc.grandTotal, paidAmount);

  const { error: billError } = await supabase
    .from("bills")
    .update({
      bill_number: parsed.bill_number,
      bill_date: parsed.bill_date,
      customer_name: parsed.customer_name,
      customer_mobile: parsed.customer_mobile || null,
      employee_id: parsed.employee_id || null,
      subtotal: calc.subtotal,
      discount: parsed.discount,
      grand_total: calc.grandTotal,
      gross_profit: calc.grossProfit,
      paid_amount: paidAmount,
      status,
      notes: parsed.notes || null,
    })
    .eq("id", id);

  if (billError) return { error: billError.message };

  await supabase.from("bill_items").delete().eq("bill_id", id);
  const { error: itemsError } = await supabase.from("bill_items").insert(
    parsed.items.map((item) => ({
      bill_id: id,
      product_id: item.product_id || null,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  await supabase.from("payment_splits").delete().eq("bill_id", id);
  const { error: splitsError } = await supabase.from("payment_splits").insert(
    parsed.payment_splits
      .filter((s) => s.amount > 0)
      .map((split) => ({ bill_id: id, method: split.method, amount: split.amount }))
  );
  if (splitsError) return { error: splitsError.message };

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/credit-customers");
  return { success: true };
}

/** Hard delete — only permitted same-day; the DB trigger is the real guard. */
export async function deleteBill(id: string) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: existing } = await supabase
    .from("bills")
    .select("created_at, locked")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!existing) return { error: "Bill not found." };
  if (existing.locked || !isSameDay(existing.created_at)) {
    return { error: "This bill can no longer be deleted — it was created on a previous day. Void it instead." };
  }

  const { error } = await supabase.from("bills").delete().eq("id", id).eq("business_id", business.id);
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Void — always allowed, regardless of age. Preserves the row for history. */
export async function voidBill(id: string) {
  const { supabase, business } = await getCurrentBusiness();
  const { error } = await supabase
    .from("bills")
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/credit-customers");
  return { success: true };
}
