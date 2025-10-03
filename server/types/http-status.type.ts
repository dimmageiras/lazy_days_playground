import type { HTTP_STATUS } from "@server/constants/http-status.constant";

type HttpErrorStatuses = Pick<
  typeof HTTP_STATUS,
  "BAD_REQUEST" | "SERVICE_UNAVAILABLE" | "UNAUTHORIZED"
>;

export type { HttpErrorStatuses };
