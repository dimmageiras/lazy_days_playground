import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from "axios";
import axios from "axios";

import { ClientIdRouteContext } from "@client/contexts/client-id-route.context";
import { CSRF_HEADER } from "@server/constants/csrf.constant";
import { HTTP_STATUS } from "@server/constants/http-status.constant";
import { API_SECURITY_ENDPOINTS } from "@shared/constants/api.constant";
import { API_SECURITY_BASE_URL } from "@shared/constants/base-urls.constant";
import { HOST, PORT } from "@shared/constants/root-env.constant";
import { TIMING } from "@shared/constants/timing.constant";
import { ApiHelper } from "@shared/helpers/api.helper";
import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { SecurityCsrfTokenListData } from "@shared/types/generated/server/api-security.type";

const { CSRF_TOKEN } = API_SECURITY_ENDPOINTS;
const { CSRF_TOKEN_MISMATCH } = HTTP_STATUS;
const { SECONDS_TEN_IN_MS, SECONDS_TEN_IN_S } = TIMING;

const { isMutatingMethod } = ApiHelper;
const { isString, toUpperCase } = StringUtilsHelper;
const { castAsType } = TypeHelper;

interface CsrfRetryQueueItem {
  config: InternalAxiosRequestConfig;
  reject: (error: unknown) => void;
  resolve: (value: AxiosResponse) => void;
}

let axiosInitialized = false;
let csrfRetryQueue: CsrfRetryQueueItem[] = [];
let currentCsrfToken = "";
let isRefreshingCsrf = false;

const fetchCsrfToken = async (): Promise<string> => {
  const response = await axios.get<SecurityCsrfTokenListData>(
    `/${API_SECURITY_BASE_URL}/${CSRF_TOKEN}`,
  );

  const token = response.data?.csrfToken;

  if (!isString(token)) {
    throw new Error("CSRF token refresh returned invalid response");
  }

  return token;
};

const addToCsrfRetryQueue = (
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> => {
  return new Promise<AxiosResponse>((resolve, reject) => {
    csrfRetryQueue.push({ config, reject, resolve });
  });
};

const processCsrfRetryQueue = (): void => {
  for (const { config, reject, resolve } of csrfRetryQueue) {
    config.headers.set(CSRF_HEADER, currentCsrfToken);
    axios(config).then(resolve).catch(reject);
  }

  csrfRetryQueue = [];
};

const rejectCsrfRetryQueue = (error: AxiosError): void => {
  for (const { reject } of csrfRetryQueue) {
    reject(error);
  }

  csrfRetryQueue = [];
};

const initAxios = (csrfToken: string): void => {
  currentCsrfToken = csrfToken;

  if (axiosInitialized) {
    return;
  }

  axiosInitialized = true;
  axios.defaults.timeout = SECONDS_TEN_IN_MS;
  axios.defaults.withCredentials = true;

  if (!globalThis.window) {
    axios.defaults.baseURL = `http://${HOST}:${PORT}`;
  }

  axios.interceptors.request.use(
    (config) => {
      const method = castAsType<Method>(config.method);

      if (isMutatingMethod(toUpperCase(method))) {
        config.headers.set(CSRF_HEADER, currentCsrfToken);
      }

      if (!globalThis.window) {
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
    },
  );

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
        console.error(
          `Request timeout: The request took longer than ${SECONDS_TEN_IN_S} seconds`,
        );
      }

      if (error.response?.status === CSRF_TOKEN_MISMATCH && error.config) {
        if (!isRefreshingCsrf) {
          isRefreshingCsrf = true;

          try {
            currentCsrfToken = await fetchCsrfToken();

            processCsrfRetryQueue();

            error.config.headers.set(CSRF_HEADER, currentCsrfToken);

            return axios(error.config);
          } catch {
            rejectCsrfRetryQueue(error);

            throw error;
          } finally {
            isRefreshingCsrf = false;
          }
        }

        return addToCsrfRetryQueue(error.config);
      }

      throw error;
    },
  );
};

export { initAxios };
