import { createHash, randomInt } from "node:crypto";

const sixDigitCodeGen = (): {
  code: string;
  hash: Buffer;
} => {
  const code = String(randomInt(100000, 999999));
  const hash = createHash("sha256").update(code).digest();

  return {
    code,
    hash,
  };
};

export const IdUtilsServerHelper = {
  sixDigitCodeGen,
};
