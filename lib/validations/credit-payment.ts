import { z } from "zod";

export const creditPaymentSchema = z.object({
  bill_id: z.string().uuid(),
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  method: z.enum(["cash", "upi", "bank"]),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export type CreditPaymentInput = z.infer<typeof creditPaymentSchema>;
