import axios from "axios";

import { apiUrl } from "./config";
import { markRequestTimedOut } from "./serverStatus";

const api = axios.create({
  baseURL: apiUrl,
  // Longer than a normal Render cold start (30-60 s, REVIEW M-10), so a
  // request that waits for the server to wake up still succeeds, but a
  // hung one does not keep a spinner going forever.
  timeout: 70000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Set by AuthProvider (logout + redirect to /login); axios lives
// outside React and cannot use the auth context directly.
let handleUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  handleUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Timed out while the server may still be asleep: the page reloads
    // once when it wakes up (serverStatus.js, REVIEW M-10).
    if (error.code === "ECONNABORTED") {
      markRequestTimedOut();
    }

    // Only requests sent with a token: a wrong password on /auth/login
    // is also 401, but must not log anyone out.
    const sentWithToken = Boolean(
      error.config?.headers?.Authorization,
    );

    if (
      error.response?.status === 401 &&
      sentWithToken &&
      handleUnauthorized
    ) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default api;