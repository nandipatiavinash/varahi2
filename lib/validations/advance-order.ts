import { z } from "zod";

export const advanceOrderSchema = z.object({
  customer_name: z.string().min(2, "Customer name is required").max(150),
  customer_mobile: z
    .string()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")),
  advance_amount: z.coerce.number().positive("Advance amount must be greater than 0"),
  expected_delivery_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

export type AdvanceOrderInput = z.infer<typeof advanceOrderSchema>;
