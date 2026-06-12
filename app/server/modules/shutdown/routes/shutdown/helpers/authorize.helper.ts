import type { FastifyRequest } from "fastify";

import { HOSTS } from "@server/constants/hosts.constant";
import { HEADERS } from "@server/modules/shutdown/constants/headers.constant";

import { SetHelper } from "@shared/helpers/set.helper";
import { StringHelper } from "@shared/helpers/string.helper";

import { TokenHelper } from "./token.helper";

const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOSTS } = HOSTS;

const { hasSetValue } = SetHelper;
const { isString } = StringHelper;
const { isAuthorizedToken } = TokenHelper;

const isAuthorizedShutdownRequest = (
  request: FastifyRequest,
  shutdownToken: string,
): boolean => {
  const token = Reflect.get(request.headers, SHUTDOWN_TOKEN);

  return (
    hasSetValue(LOOPBACK_HOSTS, request.ip) &&
    isString(token) &&
    isAuthorizedToken(token, shutdownToken)
  );
};

const AuthorizeHelper = Object.freeze({
  isAuthorizedShutdownRequest,
} as const);

export { AuthorizeHelper };
