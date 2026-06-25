export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  AR_API_BASE_URL: import.meta.env.VITE_AR_API_BASE_URL || "http://localhost:8001/api/v1",
  DISPUTE_API_BASE_URL: import.meta.env.VITE_DISPUTE_API_BASE_URL || "http://localhost:8002/api/v1",
}
