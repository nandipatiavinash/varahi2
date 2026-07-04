import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  mobile: z
    .string()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
