import ky from "ky";
import { useAuthStore } from "./useAuth";

export const API_BASE_URL = "https://api.digitservz.dz";

export const apiClient = ky.create({
  prefix: `${API_BASE_URL}/api/`, // ✅ correct in ky v2
  timeout: 120000,
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        // ✅ FIX: destructure { request }
        let token = useAuthStore.getState().token;

        if (!token) {
          try {
            const raw = localStorage.getItem("fk-pharm-auth");
            if (raw) {
              const parsed = JSON.parse(raw);
              token = parsed?.state?.token ?? null;
            }
          } catch {
            // ignore
          }
        }

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      // ✅ FIX: v2 afterResponse also receives a state object
      async ({ request, options, response }) => {
        if (response.status === 401) {
          useAuthStore.getState().logout();
        }
        return response;
      },
    ],
  },
});

export function getAuthHeaders(): Record<string, string> {
  let token = useAuthStore.getState().token;
  if (!token) {
    try {
      const raw = localStorage.getItem("fk-pharm-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token ?? null;
      }
    } catch {
      // ignore
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}
