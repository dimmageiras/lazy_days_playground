import { ClaimPortHelper } from "./helpers/claim-port";

const { claimPort } = ClaimPortHelper;

const StartupModule = Object.freeze({
  claimPort,
} as const);

export { StartupModule };
