import axios from "axios";

const apiUrl =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiUrl,
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