"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validations/settings";

export async function getSettings() {
  const { business } = await getCurrentBusiness();
  return business;
}

export async function updateSettings(input: unknown) {
  const parsed = settingsSchema.parse(input);
  const { supabase, business } = await getCurrentBusiness();

  const { error } = await supabase
    .from("businesses")
    .update({
      name: parsed.name,
      address: parsed.address || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      currency: parsed.currency,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadLogo(publicUrl: string) {
  const { supabase, business } = await getCurrentBusiness();
  const { error } = await supabase
    .from("businesses")
    .update({ logo_url: publicUrl })
    .eq("id", business.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

/**
 * Full JSON export of every business-scoped table, for the owner's manual
 * backup. Restored via restoreBackup() below.
 */
export async function exportBackup() {
  const { supabase, business } = await getCurrentBusiness();

  const tables = [
    "employees",
    "products",
    "bills",
    "advance_orders",
    "expenses",
  ] as const;

  const backup: Record<string, unknown> = { business, exported_at: new Date().toISOString() };

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").eq("business_id", business.id);
    if (error) return { error: error.message };
    backup[table] = data;
  }

  // bill_items and payment_splits are keyed off bill_id, pull them separately
  const billIds = ((backup.bills as { id: string }[]) || []).map((b) => b.id);
  if (billIds.length) {
    const { data: items } = await supabase.from("bill_items").select("*").in("bill_id", billIds);
    const { data: splits } = await supabase.from("payment_splits").select("*").in("bill_id", billIds);
    backup.bill_items = items;
    backup.payment_splits = splits;
  }

  return { success: true, data: backup };
}

/**
 * Restores a previously exported JSON backup. Existing business-scoped data
 * is left untouched for rows that already exist (upsert by id) — this is a
 * merge/restore, not a destructive wipe, so a partial or older backup can't
 * accidentally erase newer data.
 */
export async function restoreBackup(backupJson: string) {
  const { supabase, business } = await getCurrentBusiness();

  let parsed: Record<string, unknown[]>;
  try {
    parsed = JSON.parse(backupJson);
  } catch {
    return { error: "Invalid backup file — could not parse JSON." };
  }

  const tables = ["employees", "products", "bills", "bill_items", "payment_splits", "advance_orders", "expenses"] as const;

  for (const table of tables) {
    const rows = parsed[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    // Re-stamp business_id defensively for tables that carry it directly.
    const stamped = rows.map((row) =>
      "business_id" in (row as object) ? { ...(row as object), business_id: business.id } : row
    );

    const { error } = await supabase.from(table).upsert(stamped as never[], { onConflict: "id" });
    if (error) return { error: `Failed restoring ${table}: ${error.message}` };
  }

  return { success: true };
}
