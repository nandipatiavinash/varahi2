import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "Paints",
  "Steel",
  "Cement",
  "Tiles",
  "Hardware",
  "Plumbing",
  "Construction Materials",
] as const;

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required").max(150),
  category: z.string().min(1, "Category is required"),
  default_purchase_price: z.coerce.number().min(0, "Must be 0 or more"),
  default_selling_price: z.coerce.number().min(0, "Must be 0 or more"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ProductInput = z.infer<typeof productSchema>;
