import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

import type {
  checkEmailRequestSchema,
  checkEmailResponseSchema,
} from "../../server/routes/user/check-email/check-email-route.schema";

type CheckEmailRequest = ZodInfer<typeof checkEmailRequestSchema>;

type CheckEmailResponse = ZodInfer<typeof checkEmailResponseSchema>;

export type { CheckEmailRequest, CheckEmailResponse };
