import type { signinSchema } from "@client/pages/Signin/components/SigninForm/schemas/signin-form.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type SigninForm = ZodInfer<typeof signinSchema>;

export type { SigninForm };
