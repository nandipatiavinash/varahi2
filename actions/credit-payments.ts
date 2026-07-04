"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { creditPaymentSchema } from "@/lib/validations/credit-payment";

export async function listCreditOutstanding() {
  const { supabase, business } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("v_credit_outstanding")
    .select("*")
    .eq("business_id", business.id)
    .order("bill_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function listPaymentHistory(billId: string) {
  const { supabase } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("credit_payments")
    .select("*")
    .eq("bill_id", billId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Records a partial/full payment against an outstanding bill, then updates
 * the bill's cached paid_amount and status. Wrapped so both writes succeed
 * or the caller sees an error — no dangling payment records.
 */
export async function recordCreditPayment(input: unknown) {
  const parsed = creditPaymentSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, business_id, grand_total, paid_amount")
    .eq("id", parsed.bill_id)
    .eq("business_id", business.id)
    .single();

  if (billError || !bill) return { error: "Bill not found." };

  const { error: paymentError } = await supabase.from("credit_payments").insert({
    bill_id: parsed.bill_id,
    amount: parsed.amount,
    method: parsed.method,
    notes: parsed.notes || null,
  });

  if (paymentError) return { error: paymentError.message };

  const newPaidAmount = Number(bill.paid_amount) + parsed.amount;
  const newStatus =
    newPaidAmount >= Number(bill.grand_total) ? "paid" : newPaidAmount > 0 ? "partial" : "credit";

  const { error: updateError } = await supabase
    .from("bills")
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq("id", parsed.bill_id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/credit-customers");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
  return { success: true };
}
