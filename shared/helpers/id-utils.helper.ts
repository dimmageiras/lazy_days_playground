import {
  v4 as uuidv4,
  v7 as uuidv7,
  validate as uuidValidate,
  version as uuidVersion,
} from "uuid";

const fastIdGen = (): string => {
  return uuidv4();
};

const secureIdGen = (): string => {
  return uuidv7();
};

const isSecureId = (id: string): boolean => {
  return uuidValidate(id) && uuidVersion(id) === 7;
};

export const IdUtilsHelper = {
  fastIdGen,
  isSecureId,
  secureIdGen,
};
