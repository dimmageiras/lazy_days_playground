import type { AxiosError } from "axios";
import axios from "axios";

import { HOST, IS_SSR, PORT } from "@shared/constants/root-env.constant";
import { TIMING } from "@shared/constants/timing.constant";

const { API_TIMEOUT, EXPENSIVE } = TIMING;

axios.defaults.withCredentials = true;
axios.defaults.timeout = API_TIMEOUT;

// Configure base URL for SSR
if (IS_SSR) {
  // We're on the server, set the base URL to the full server address
  axios.defaults.baseURL = `http://${HOST}:${PORT}`;
}

axios.interceptors.request.use(
  (config) => {
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
        `Request timeout: The request took longer than ${
          API_TIMEOUT / EXPENSIVE
        } seconds`
      );
    }

    return Promise.reject(error);
  }
);

export default axios;
