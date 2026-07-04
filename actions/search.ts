"use server";

import { getCurrentBusiness } from "@/lib/supabase/server";

export async function globalSearch(query: string) {
  const { supabase, business } = await getCurrentBusiness();
  if (!query || query.trim().length < 2) {
    return { bills: [], employees: [], products: [] };
  }

  const term = `%${query.trim()}%`;

  const [billsRes, employeesRes, productsRes] = await Promise.all([
    supabase
      .from("bills")
      .select("id, bill_number, customer_name, bill_date, grand_total, status")
      .eq("business_id", business.id)
      .or(`bill_number.ilike.${term},customer_name.ilike.${term}`)
      .limit(10),
    supabase
      .from("employees")
      .select("id, name, mobile, status")
      .eq("business_id", business.id)
      .ilike("name", term)
      .limit(10),
    supabase
      .from("products")
      .select("id, name, category, default_selling_price, status")
      .eq("business_id", business.id)
      .ilike("name", term)
      .limit(10),
  ]);

  return {
    bills: billsRes.data ?? [],
    employees: employeesRes.data ?? [],
    products: productsRes.data ?? [],
  };
}
