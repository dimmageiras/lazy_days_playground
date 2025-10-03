import type { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type AuthFormData = ZodInfer<typeof authFormSchema>;

export type { AuthFormData };
