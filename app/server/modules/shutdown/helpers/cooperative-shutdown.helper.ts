import axios from "axios";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";

import { ENDPOINTS } from "../constants/endpoints.constant";
import { HEADERS } from "../constants/headers.constant";
import { TIMING_IN_MS } from "../constants/timing.constant";

const { API_INTERNAL } = BASE_URLS;
const { SHUTDOWN } = ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { HTTP } = HTTP_SCHEMES;
const { SHUTDOWN_REQUEST_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;

const requestCooperativeShutdown = async (
  instance: AppInstance,
): Promise<boolean> => {
  const port = instance.appEnv.port;
  const shutdownToken = instance.appEnv.shutdownToken;

  try {
    const allowedDomainAndPort =
      `${instance.appEnv.bindAllIpv4}:${port}` as const;
    const shutdownPath = `${API_INTERNAL}/${SHUTDOWN}` as const;
    const baseUrl = `${HTTP}://${allowedDomainAndPort}` as const;
    const shutdownUrl = `${baseUrl}${shutdownPath}` as const;
    const parsedUrl = new URL(shutdownUrl);

    await axios.post(
      parsedUrl.href,
      {},
      {
        headers: { [SHUTDOWN_TOKEN]: shutdownToken },
        maxRedirects: 0,
        signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT),
      },
    );

    return true;
  } catch (error) {
    instance.log.warn(
      { ...normalizeError(error), port },
      "🚧 Cooperative shutdown request failed.",
    );

    return false;
  }
};

const CooperativeShutdownHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);

export { CooperativeShutdownHelper };
