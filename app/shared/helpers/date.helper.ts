import dayjs, { type ConfigType } from "dayjs";
import utcPlugin from "dayjs/plugin/utc.js";

import type { TIMING_IN_S } from "@shared/constants/timing.constant";

dayjs.extend(utcPlugin);

const getCurrentISOTimestamp = (): string => {
  return dayjs().toISOString();
};

const getCurrentTimestamp = (): number => {
  return dayjs().valueOf();
};

const getCurrentUTCDate = (): Date => {
  return dayjs().utc().toDate();
};

const getFutureUTCDate = (
  maxAgeSeconds: (typeof TIMING_IN_S)[keyof typeof TIMING_IN_S],
): Date => {
  return dayjs().utc().add(maxAgeSeconds, "seconds").toDate();
};

const toDisplayHour = (date: ConfigType): string => {
  return dayjs(date).utc().format("h a");
};

const toDisplayTimestamp = (date: ConfigType): string => {
  return dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss [UTC]");
};

const toISOTimestamp = (date: ConfigType): string => {
  return dayjs(date).toISOString();
};

const toLocalTimestamp = (date: ConfigType): string => {
  return dayjs(date).format("MM/DD/YYYY, hh:mm:ss A");
};

const DateHelper = Object.freeze({
  getCurrentISOTimestamp,
  getCurrentTimestamp,
  getCurrentUTCDate,
  getFutureUTCDate,
  toDisplayHour,
  toDisplayTimestamp,
  toISOTimestamp,
  toLocalTimestamp,
} as const);

export { DateHelper };
