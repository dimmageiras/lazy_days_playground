import type { AxiosResponse } from "axios";

import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";

const { isString } = StringUtilsHelper;

/**
 * Normalizes the `set-cookie` header from a response headers record
 * into a `readonly string[]`. Node/axios may return `string`,
 * `string[]`, or `undefined`.
 */
const getSetCookieHeaders = (
  headers: AxiosResponse["headers"],
): readonly string[] | undefined => {
  const raw = headers["set-cookie"];

  return raw?.filter((value) => isString(value));
};

/**
 * Finds a specific `Set-Cookie` header by cookie name from a
 * response headers record.
 */
const findSetCookieHeader = (
  headers: AxiosResponse["headers"],
  cookieName: string,
): string | undefined => {
  const cookies = getSetCookieHeaders(headers);

  return cookies?.find((cookie) => cookie.startsWith(`${cookieName}=`));
};

const setSetCookieHeader = (response: Response, cookie: string): void => {
  response.headers.append("Set-Cookie", cookie);
};

export const ServicesHelper = {
  findSetCookieHeader,
  setSetCookieHeader,
};
