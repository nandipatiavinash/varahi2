"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/product";

export async function listProducts() {
  const { supabase, business } = await getCurrentBusiness();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase.from("products").insert({
    business_id: business.id,
    ...parsed,
  });

  if (error) return { error: error.message };

  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(id: string, input: unknown) {
  const parsed = productSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("products")
    .update(parsed)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/products");
  return { success: true };
}
