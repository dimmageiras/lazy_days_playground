import type { AxiosError } from "axios";
import axios from "axios";

import { HOST, IS_SSR, PORT } from "@shared/constants/root-env.constant";

axios.defaults.withCredentials = true;

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
      console.error("Request timeout: The request took longer than 10 seconds");
    }

    return Promise.reject(error);
  }
);

export default axios;
