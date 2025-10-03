import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";
import { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";
import { zDiscriminatedUnion, zLiteral } from "@shared/wrappers/zod.wrapper";

const authFormSchema = zDiscriminatedUnion("mode", [
  signinRequestSchema.safeExtend({
    mode: zLiteral("signin"),
  }),
  signupRequestSchema.safeExtend({
    mode: zLiteral("signup"),
  }),
]);

export { authFormSchema };
