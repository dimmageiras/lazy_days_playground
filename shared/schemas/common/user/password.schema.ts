import { zString } from "../../../wrappers/zod.wrapper.ts";

/**
 * Shared password validation schema
 *
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 50 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * Used in: signup, password reset, password change
 */
const passwordValidationSchema = zString()
  .min(8, "Password must be at least 8 characters")
  .max(50, "Password must be less than 50 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /\d/.test(password), {
    message: "Password must contain at least one number",
  });

export { passwordValidationSchema };
