import axios from 'axios';
import { BASE_URL } from './config';
import { showToast } from './toast'; // 👇 IMPORT YOUR TOAST UTILITY 👇

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Skip adding token for auth endpoints
    if (config.url?.includes("/refresh_token") ||
      config.url?.includes("/auth/login") ||
      config.url?.includes("/otp/request") ||
      config.url?.includes("/otp/verify") ||
      config.url?.includes("/auth/register")) {
      return config;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message?.toLowerCase() || "";

    // ------------------------------------------------------------------
    // 🔥 1. GLOBAL BANNED / SUSPENDED CHECK 🔥
    // ------------------------------------------------------------------
    // If the backend says the account is banned/suspended, kick them out immediately.
    if (status === 403 && (errorMessage.includes("banned") || errorMessage.includes("suspended"))) {

      // 1. Clear the token
      localStorage.removeItem("access_token");

      // 2. Show the toast with the backend's exact message
      showToast({
        icon: "error",
        title: error.response?.data?.message || "Account Suspended. Contact Admin."
      });

      // 3. Kick them to login (if they aren't already there)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
    // ------------------------------------------------------------------

    // Skip token refresh logic for auth endpoints
    const skipRefreshUrls = ['/auth/login', '/auth/register', '/refresh_token'];
    if (skipRefreshUrls.some(url => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/refresh_token`, {}, { withCredentials: true });
        const { accessToken } = response.data;
        localStorage.setItem('access_token', accessToken);

        // Process queued requests
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;