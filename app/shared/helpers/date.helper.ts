import dayjs, { type ConfigType } from "dayjs";
import utcPlugin from "dayjs/plugin/utc.js";

import type { TIMING_IN_S } from "@shared/constants/timing.constant";

// Extend dayjs with UTC plugin once at module load; downstream `.utc()` calls depend on it.
dayjs.extend(utcPlugin);

const getCurrentDate = (): Date => {
  return dayjs().toDate();
};

const getCurrentISOTimestamp = (): string => {
  return dayjs().toISOString();
};

const getCurrentTimestamp = (): number => {
  return dayjs().valueOf();
};

const getFutureDate = (
  maxAgeSeconds: (typeof TIMING_IN_S)[keyof typeof TIMING_IN_S],
): Date => {
  return dayjs().add(maxAgeSeconds, "seconds").toDate();
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
  getCurrentDate,
  getCurrentISOTimestamp,
  getCurrentTimestamp,
  getFutureDate,
  toDisplayHour,
  toDisplayTimestamp,
  toISOTimestamp,
  toLocalTimestamp,
} as const);

export { DateHelper };
