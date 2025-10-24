import { DateHelper } from "../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../shared/helpers/id-utils.helper.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const { getCurrentISOTimestamp } = DateHelper;
const { fastIdGen } = IdUtilsHelper;
const { log } = PinoLogHelper;

export const RoutesHelper = {
  fastIdGen,
  getCurrentISOTimestamp,
  log,
};
