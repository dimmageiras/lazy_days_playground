import axios from "axios";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";
import { MapHelper } from "@shared/helpers/map.helper";

import { ENDPOINTS } from "../constants/endpoints.constant";
import { HEADERS } from "../constants/headers.constant";
import {
  SHUTDOWN_PHRASES,
  SIGNAL_MESSAGES,
} from "../constants/messages.constant";
import { TIMING_IN_MS } from "../constants/timing.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/shutdown.type";

const { API_INTERNAL } = BASE_URLS;
const { SHUTDOWN } = ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { HTTP } = HTTP_SCHEMES;
const { SHUTTING_DOWN } = SHUTDOWN_PHRASES;
const { SHUTDOWN_REQUEST_TIMEOUT, SHUTDOWN_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;
const { getMapValue } = MapHelper;

const buildShutdownOptions = (logger: AppInstance["log"]): ShutdownOptions => {
  return {
    delay: SHUTDOWN_TIMEOUT,
    logger,
  };
};

const buildShutdownHandler = (instance: AppInstance): ShutdownHandler => {
  return async ({
    err: error,
    manual,
    signal,
  }: ShutdownContext): Promise<void> => {
    switch (true) {
      case Boolean(error): {
        instance.log.error(
          normalizeError(error),
          "💥 Shutting down after an unhandled error",
        );

        break;
      }

      case manual: {
        instance.log.info(`Manual shutdown requested, ${SHUTTING_DOWN}`);

        break;
      }

      default: {
        const fallbackMessage = `Received a shutdown signal, ${SHUTTING_DOWN}`;

        const signalMessage = getMapValue(
          SIGNAL_MESSAGES,
          signal ?? "",
          fallbackMessage,
        );

        instance.log.info(signalMessage);
      }
    }

    await instance.close();
  };
};

const requestCooperativeShutdown = async (
  instance: AppInstance,
): Promise<boolean> => {
  const port = instance.appEnv.port;
  const shutdownToken = instance.appEnv.shutdownToken;

  try {
    const shutdownPath = `${API_INTERNAL}/${SHUTDOWN}` as const;
    const baseUrl = `${HTTP}://${instance.appEnv.bindAllIpv4}:${port}` as const;
    const shutdownUrl = `${baseUrl}${shutdownPath}` as const;

    await axios.post(
      shutdownUrl,
      {},
      {
        headers: { [SHUTDOWN_TOKEN]: shutdownToken },
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

const ShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
  requestCooperativeShutdown,
} as const);

export { ShutdownHelper };
