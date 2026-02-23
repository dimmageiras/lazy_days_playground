import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";
import { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";
import { checkEmailRequestSchema } from "@shared/schemas/user/check-email-route.schema";
import { zDiscriminatedUnion, zLiteral } from "@shared/wrappers/zod.wrapper";

const authFormSchema = zDiscriminatedUnion("mode", [
  checkEmailRequestSchema.safeExtend({
    mode: zLiteral("checkEmail").meta({
      description: "Form mode",
      example: "checkEmail",
    }),
  }),
  signinRequestSchema.safeExtend({
    mode: zLiteral("signin").meta({
      description: "Form mode",
      example: "signin",
    }),
  }),
  signupRequestSchema.safeExtend({
    mode: zLiteral("signup").meta({
      description: "Form mode",
      example: "signup",
    }),
  }),
]);

export { authFormSchema };
