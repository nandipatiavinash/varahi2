import { z } from "zod";

export const billLineSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_name_snapshot: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  purchase_price: z.coerce.number().min(0, "Must be 0 or more"),
  selling_price: z.coerce.number().min(0, "Must be 0 or more"),
});

export const paymentSplitSchema = z.object({
  method: z.enum(["cash", "upi", "bank", "credit", "advance"]),
  amount: z.coerce.number().min(0),
});

export const billSchema = z.object({
  id: z.string().uuid().optional(),
  bill_number: z.string().min(1, "Bill number is required").max(50),
  bill_date: z.string().min(1, "Bill date is required"),
  customer_name: z.string().min(2, "Customer name is required").max(150),
  customer_mobile: z
    .string()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")),
  employee_id: z.string().uuid().nullable().optional(),
  items: z.array(billLineSchema).min(1, "Add at least one product"),
  discount: z.coerce.number().min(0).default(0),
  grand_total_override: z.coerce.number().min(0).nullable().optional(),
  payment_splits: z.array(paymentSplitSchema).min(1, "Add at least one payment method"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type BillInput = z.infer<typeof billSchema>;
