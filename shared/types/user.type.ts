import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

import type {
  checkEmailRequestSchema,
  checkEmailResponseSchema,
} from "../schemas/user/check-email-route.schema";

type CheckEmailRequest = ZodInfer<typeof checkEmailRequestSchema>;

type CheckEmailResponse = ZodInfer<typeof checkEmailResponseSchema>;

export type { CheckEmailRequest, CheckEmailResponse };
