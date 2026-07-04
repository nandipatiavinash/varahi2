"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/validations/employee";

export async function listEmployees() {
  const { supabase, business } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createEmployee(input: unknown) {
  const parsed = employeeSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase.from("employees").insert({
    business_id: business.id,
    ...parsed,
  });

  if (error) return { error: error.message };
  revalidatePath("/employees");
  return { success: true };
}

export async function updateEmployee(id: string, input: unknown) {
  const parsed = employeeSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("employees")
    .update(parsed)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/employees");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/employees");
  return { success: true };
}
