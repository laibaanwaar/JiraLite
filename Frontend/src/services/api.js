import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT automatically only for protected APIs.
// Login must never receive an existing Authorization token.
api.interceptors.request.use(
  (config) => {
    const requestUrl = (config.url || "").toLowerCase();

    // authService may call "/login/" while baseURL already contains "/api/auth".
    const isLoginRequest =
      requestUrl === "/login/" ||
      requestUrl === "/login" ||
      requestUrl.endsWith("/auth/login/") ||
      requestUrl.endsWith("/auth/login");

    if (isLoginRequest) {
      // Explicitly make sure no stale JWT is sent to login.
      if (config.headers?.delete) {
        config.headers.delete("Authorization");
      } else if (config.headers) {
        delete config.headers.Authorization;
      }

      return config;
    }

    const accessToken = localStorage.getItem("access_token");

    const hasValidStoredToken =
      accessToken &&
      accessToken !== "undefined" &&
      accessToken !== "null";

    if (hasValidStoredToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;