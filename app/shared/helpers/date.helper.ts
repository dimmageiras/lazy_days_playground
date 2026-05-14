import dayjs, { type ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc.js";

import type { TIMING_IN_S } from "@shared/constants/timing.constant";

dayjs.extend(utc);

const formatHourForDisplay = (date: ConfigType): string => {
  return dayjs(date).utc().format("h a");
};

const formatTimestampForDisplay = (date: ConfigType): string => {
  return dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss [UTC]");
};

const formatTimestampLocal = (date: ConfigType): string => {
  return dayjs(date).format("MM/DD/YYYY, hh:mm:ss A");
};

const getCurrentISOTimestamp = (): string => {
  return dayjs().utc().toISOString();
};

const getCurrentUTCDate = (): Date => {
  return dayjs().utc().toDate();
};

const getFutureUTCDate = (
  maxAge: (typeof TIMING_IN_S)[keyof typeof TIMING_IN_S],
): Date => {
  return dayjs().utc().add(maxAge, "seconds").toDate();
};

const toISOTimestamp = (date: ConfigType): string => {
  return dayjs(date).utc().toISOString();
};

const DateHelper = Object.freeze({
  formatHourForDisplay,
  formatTimestampForDisplay,
  formatTimestampLocal,
  getCurrentISOTimestamp,
  getCurrentUTCDate,
  getFutureUTCDate,
  toISOTimestamp,
});

export { DateHelper };
