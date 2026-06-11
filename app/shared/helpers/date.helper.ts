import dayjs, { type ConfigType } from "dayjs";
import utcPlugin from "dayjs/plugin/utc.js";

import type { TimingInSeconds } from "@shared/types/timing.type";

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

const getFutureDate = (maxAgeSeconds: TimingInSeconds): Date => {
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
