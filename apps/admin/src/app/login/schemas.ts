import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ invalid_type_error: "Required" })
    .min(1, "Required")
    .email("Invalid email"),
  password: z.string({ invalid_type_error: "Required" }).min(1, "Required"),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
