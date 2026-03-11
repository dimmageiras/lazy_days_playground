import {
  v4 as uuidv4,
  v7 as uuidv7,
  validate as uuidValidate,
  version as uuidVersion,
} from "uuid";

const fastIdGen = (): string => {
  return uuidv4();
};

const isSecureId = (id: string): boolean => {
  return uuidValidate(id) && uuidVersion(id) === 7;
};

const secureIdGen = (): string => {
  return uuidv7();
};

const sixDigitCodeGenOnServer = async (): Promise<{
  code: string;
  hash: Buffer;
}> => {
  if (globalThis.window) {
    throw new Error("sixDigitCodeGenOnServer can only be called on the server");
  }

  const { createHash, randomInt } = await import("node:crypto");

  const code = String(randomInt(100000, 999999));
  const hash = createHash("sha256").update(code).digest();

  return {
    code,
    hash,
  };
};

export const IdUtilsHelper = {
  fastIdGen,
  isSecureId,
  secureIdGen,
  sixDigitCodeGenOnServer,
};
