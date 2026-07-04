"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense";

export async function listExpenses(filters?: { from?: string; to?: string }) {
  const { supabase, business } = await getCurrentBusiness();
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("business_id", business.id)
    .order("date", { ascending: false });

  if (filters?.from) query = query.gte("date", filters.from);
  if (filters?.to) query = query.lte("date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createExpense(input: unknown) {
  const parsed = expenseSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase.from("expenses").insert({
    business_id: business.id,
    ...parsed,
  });

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpense(id: string, input: unknown) {
  const parsed = expenseSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("expenses")
    .update(parsed)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
