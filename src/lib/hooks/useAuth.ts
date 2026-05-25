import { create } from "zustand";
import { persist } from "zustand/middleware";
import ky, { HTTPError } from "ky";

export type UserRole =
  | "admin"
  | "accountant"
  | "technique"
  | "distributor"
  | "agent_commercial";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
  phone?: string;
  city?: string;
  signature?: string;
  company?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (email: string, password: string) => Promise<string | void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const API_BASE_URL = "https://api.digitservz.dz";

// ─── Authenticated API client ──────────────────────────────────────────────

export const api = ky.create({
  prefix: `${API_BASE_URL}/api/`, // keep "prefix" if that's what your ky version uses
  timeout: 15000,
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        let token = useAuthStore.getState().token;

        // Fallback to localStorage during rehydration
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
      async ({ response }) => {
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

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      login: async (email: string, password: string) => {
        try {
          const response = await api
            .post("auth/login", { json: { email, password } })
            .json<{ token: string; user: User }>();

          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
          });
        } catch (error: any) {
          if (error instanceof HTTPError) {
            try {
              const errorData = (await error.response.json()) as {
                error?: string;
                message?: string;
              };
              return (
                errorData.error ||
                errorData.message ||
                "Identifiants incorrects"
              );
            } catch {
              return `Erreur serveur ${error.response.status}`;
            }
          }
          return "Erreur de connexion au serveur";
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        window.location.href = "/login";
      },

      fetchUser: async () => {
        try {
          const user = await api.get("auth/me").json<User>();
          set({ user });
        } catch (error) {
          console.error("Erreur fetchUser:", error);
        }
      },
    }),
    {
      name: "fk-pharm-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
