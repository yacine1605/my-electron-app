import { useAuthStore } from "./hooks/useAuth";

const API_BASE_URL = "https://api.digitservz.dz/api/";
let isLoggingOut = false;

// Never send a stale token to these endpoints
const PUBLIC_ENDPOINTS = ["auth/login", "auth/register", "auth/refresh"];

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  const isPublic = PUBLIC_ENDPOINTS.some((pe) => endpoint.endsWith(pe));

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // Only attach token for protected routes
  if (token && !isPublic) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (!isLoggingOut) {
      isLoggingOut = true;
      useAuthStore.getState().logout();
      setTimeout(() => {
        isLoggingOut = false;
      }, 0);
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
