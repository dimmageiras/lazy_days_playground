import { DateHelper } from "../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../shared/helpers/id-utils.helper.ts";
import { EncryptionHelper } from "./encryption.helper.ts";
import { GelDbHelper } from "./gel-db.helper.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const { getCurrentISOTimestamp } = DateHelper;
const { fastIdGen } = IdUtilsHelper;
const { encryptData, decryptData } = EncryptionHelper;
const { handleAuthError } = GelDbHelper;
const { log } = PinoLogHelper;

export const RoutesHelper = {
  decryptData,
  encryptData,
  fastIdGen,
  getCurrentISOTimestamp,
  handleAuthError,
  log,
};
