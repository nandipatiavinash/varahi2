import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(2, "Business name is required").max(150),
  address: z.string().max(300).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  currency: z.string().min(1).default("INR"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
