import type { signinSchema } from "@client/pages/Signin/components/Form/schemas/signin.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type SigninForm = ZodInfer<typeof signinSchema>;

export type { SigninForm };
