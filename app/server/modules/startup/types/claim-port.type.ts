import type { AppInstance } from "@server/types/instance.type";

type ClaimPortFunction = (instance: AppInstance) => Promise<void>;

export type { ClaimPortFunction };
