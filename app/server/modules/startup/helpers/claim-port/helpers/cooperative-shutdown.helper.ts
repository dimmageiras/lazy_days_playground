import axios from "axios";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { API_INTERNAL_ENDPOINTS } from "@server/constants/endpoints.constant";
import { HEADERS } from "@server/constants/headers.constant";
import { HOSTS } from "@server/constants/hosts.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import { TIMING_IN_MS } from "@server/modules/startup/constants/timing.constant";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";

const { API_INTERNAL } = BASE_URLS;
const { SHUTDOWN } = API_INTERNAL_ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { HTTP } = HTTP_SCHEMES;
const { SHUTDOWN_REQUEST_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;

const requestCooperativeShutdown = async (
  instance: AppInstance,
): Promise<boolean> => {
  const port = instance.appEnv.port;
  const shutdownToken = instance.appEnv.shutdownToken;

  if (port < 1 || port > 65535) {
    instance.log.warn(
      { port },
      "🚧 Invalid port number for cooperative shutdown request.",
    );

    return false;
  }

  try {
    const allowedHostAndPort = `${LOOPBACK_HOST_V4}:${port}` as const;
    const shutdownPath = `${API_INTERNAL}/${SHUTDOWN}` as const;
    const baseUrl = `${HTTP}://${allowedHostAndPort}` as const;
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
