import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Fuel",
  "Transport",
  "Maintenance",
  "Miscellaneous",
] as const;

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().max(300).optional().or(z.literal("")),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
