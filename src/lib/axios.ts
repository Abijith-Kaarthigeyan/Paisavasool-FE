import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { ENV } from "@/config/env"

const commonConfig = {
  withCredentials: true, // Crucial for HTTPOnly cookies to be sent cross-origin
  headers: {
    "Content-Type": "application/json",
  },
}

// Client targeting the Auth Service
export const authApi = axios.create({
  baseURL: ENV.API_BASE_URL,
  ...commonConfig,
})

// Client targeting the Accounts Receivable Service
export const arApi = axios.create({
  baseURL: ENV.AR_API_BASE_URL,
  ...commonConfig,
})

// Export api as backward-compatible alias to authApi
export const api = authApi;

// Variables to handle refreshing token state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Setup Request Interceptors (trace ID)
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (!config.headers["X-Request-ID"]) {
    config.headers["X-Request-ID"] = crypto.randomUUID();
  }
  return config;
};

authApi.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
arApi.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

// Setup Response Interceptor for handling token refresh & 401 logouts
const setupResponseInterceptor = (instance: typeof authApi) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      
      // Check if 401 Unauthorized and we haven't already retried
      if (
        error.response?.status === 401 && 
        originalRequest && 
        !(originalRequest as any)._retry &&
        !originalRequest.url?.includes("/auth/login") &&
        !originalRequest.url?.includes("/auth/refresh")
      ) {
        (originalRequest as any)._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        try {
          // Trigger token refresh via the Auth Service endpoint
          await authApi.post("/auth/refresh");
          
          // Re-fetch current user profile to update Redux store with new expiration timestamp
          try {
            const meResponse = await authApi.get("/auth/me");
            const freshUser = meResponse.data;
            const { store } = await import("@/app/store");
            const { setCredentials } = await import("@/features/auth/slices/authSlice");
            const { getCookie } = await import("@/lib/cookies");

            const expiresAtStr = getCookie("access_token_expires_at");
            const exp = expiresAtStr ? parseInt(expiresAtStr, 10) : Math.floor(Date.now() / 1000) + 2700;

            store.dispatch(
              setCredentials({
                sub: freshUser.id,
                email: freshUser.email,
                role: freshUser.role.role_name,
                is_active: freshUser.is_active,
                exp,
              })
            );
          } catch (meError) {
            console.error("Failed to update credentials after refresh:", meError);
          }

          processQueue(null);
          isRefreshing = false;
          
          return instance(originalRequest);
        } catch (refreshError: any) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Clear credentials and redirect to login page
          try {
            const { store } = await import("@/app/store");
            const { clearCredentials } = await import("@/features/auth/slices/authSlice");
            store.dispatch(clearCredentials());
          } catch (clearError) {
            console.error("Failed to clear credentials on refresh failure:", clearError);
          }

          if (typeof window !== "undefined") {
            window.location.href = "/login?session_expired=true";
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

setupResponseInterceptor(authApi);
setupResponseInterceptor(arApi);
