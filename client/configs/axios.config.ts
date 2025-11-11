import type { AxiosError } from "axios";
import axios from "axios";

import { ClientIdRouteContext } from "@client/contexts/client-id-route.context";
import { HOST, IS_SSR, PORT } from "@shared/constants/root-env.constant";
import { TIMING } from "@shared/constants/timing.constant";

const { SECONDS_TEN_IN_MS, SECONDS_TEN_IN_S } = TIMING;

axios.defaults.withCredentials = true;
axios.defaults.timeout = SECONDS_TEN_IN_MS;

// Configure base URL for SSR
if (IS_SSR) {
  // We're on the server, set the base URL to the full server address
  axios.defaults.baseURL = `http://${HOST}:${PORT}`;
}

axios.interceptors.request.use(
  (config) => {
    if (IS_SSR) {
      const { getRequest } = ClientIdRouteContext;

      const request = getRequest();

      if (request) {
        const cookie = request.headers.get("cookie");

        if (cookie) {
          config.headers.cookie = cookie;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.error(
        `Request timeout: The request took longer than ${SECONDS_TEN_IN_S} seconds`
      );
    }

    return Promise.reject(error);
  }
);
