"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { advanceOrderSchema } from "@/lib/validations/advance-order";

export async function listAdvanceOrders() {
  const { supabase, business } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("advance_orders")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createAdvanceOrder(input: unknown) {
  const parsed = advanceOrderSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase.from("advance_orders").insert({
    business_id: business.id,
    ...parsed,
    expected_delivery_date: parsed.expected_delivery_date || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/advance-orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAdvanceOrder(id: string, input: unknown) {
  const parsed = advanceOrderSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("advance_orders")
    .update({ ...parsed, expected_delivery_date: parsed.expected_delivery_date || null })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/advance-orders");
  return { success: true };
}

export async function cancelAdvanceOrder(id: string) {
  const { supabase, business } = await getCurrentBusiness();
  const { error } = await supabase
    .from("advance_orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/advance-orders");
  return { success: true };
}

/**
 * Marks an advance order as completed once it has been converted into a
 * sale from the billing screen (the new bill's payment_splits will include
 * an "advance" line for this amount).
 */
export async function markAdvanceOrderConverted(id: string, billId: string) {
  const { supabase, business } = await getCurrentBusiness();
  const { error } = await supabase
    .from("advance_orders")
    .update({ status: "completed", converted_bill_id: billId })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/advance-orders");
  revalidatePath("/sales");
  return { success: true };
}
