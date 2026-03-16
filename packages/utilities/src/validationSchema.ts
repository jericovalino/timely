import { z } from "zod";

export const phMobileNumberRegex = new RegExp(/^\+639[0-9]{9}$/);
export const alphanumericAndSpaces = new RegExp(/^[a-zA-Z0-9 '-]+$/);
const validationSchema = {
  password: z
    .string({
      message: "Required",
    })
    .min(1, "Required")
    .min(8, "Must be at least 8 characters")
    .max(16, "Must not be more than 16 characters")
    .regex(/[a-z]/, "Must have at least one lowercase letter")
    .regex(/[A-Z]/, "Must have at least one uppercase letter")
    .regex(/^\S+$/, "Must not contain space")
    .regex(/^(?=.*\d).+$/, "Must have at least one number")
    .regex(
      /^(?=.*[!@#$%^&*()_+=\-[\]{}|\\:;"'<>,.?/~])/,
      "Must have at least one special characters",
    ),
  // mobile_number: z
  //   .string({
  //     invalid_type_error: "Required",
  //
  //   })
  //   .superRefine((value, ctx) => {
  //     const rawValue = value.trim();
  //     if (["", "+63"].includes(rawValue)) {
  //       ctx.addIssue({
  //         code: ZodIssueCode.too_small,
  //         inclusive: true,
  //         minimum: 1,
  //         type: "string",
  //         message: "Required",
  //       });
  //       return;
  //     }
  //     if (!phMobileNumberRegex.test(rawValue)) {
  //       ctx.addIssue({
  //         code: ZodIssueCode.custom,
  //         message: "Invalid",
  //       });
  //     }
  //   }),
};

export default validationSchema;
