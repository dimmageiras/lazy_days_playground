import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

const isAuthorizedToken = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const TokenHelper = Object.freeze({
  isAuthorizedToken,
} as const);

export { TokenHelper };
