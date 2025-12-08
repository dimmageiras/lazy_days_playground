import { DateHelper } from "../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../shared/helpers/id-utils.helper.ts";
import { AuthClientHelper } from "./auth-client.helper.ts";
import { EncryptionHelper } from "./encryption.helper.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const { createAuth, getBaseUrl, getClient, handleAuthError } = AuthClientHelper;
const { getCurrentISOTimestamp, toISOTimestamp } = DateHelper;
const { fastIdGen } = IdUtilsHelper;
const { encryptData, decryptData } = EncryptionHelper;

const { log } = PinoLogHelper;

export const RoutesHelper = {
  createAuth,
  decryptData,
  encryptData,
  fastIdGen,
  getBaseUrl,
  getClient,
  getCurrentISOTimestamp,
  handleAuthError,
  log,
  toISOTimestamp,
};
