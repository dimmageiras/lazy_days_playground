import type { AxiosError } from "axios";
import axios from "axios";

axios.defaults.timeout = 1000;
axios.defaults.withCredentials = true;

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
