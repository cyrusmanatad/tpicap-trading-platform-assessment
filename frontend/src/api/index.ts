import axios, { AxiosHeaders, type AxiosError, type AxiosResponse } from "axios";

const apiUrl = (
  import.meta.env.VITE_BACKEND_API && import.meta.env.VITE_BACKEND_API.trim() !== ""
    ? import.meta.env.VITE_BACKEND_API
    : (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== ""
        ? import.meta.env.VITE_API_URL
        : "")
);

const getTimezoneOffsetHeader = () => {
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  return `${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
};

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
    "X-Timezone": getTimezoneOffsetHeader(),
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("trading-desk-token");
  if (token) {
    config.headers = config.headers ?? new AxiosHeaders();
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;

    if (status === 401) {
      const message = "Your session has expired. Please log in again.";
      localStorage.setItem("trading-desk-auth-message", message);
      window.dispatchEvent(new CustomEvent("session-expired", { detail: message }));
      localStorage.removeItem("trading-desk-token");
      localStorage.removeItem("trading-desk-user");
    }

    return Promise.reject(error);
  }
);
