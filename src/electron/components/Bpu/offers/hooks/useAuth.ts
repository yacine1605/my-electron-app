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

// ─── Client ky pour auth uniquement ─────────────────────────────────────────

const api = ky.create({
  prefix: "https://api.digitservz.dz/api/",
  timeout: 15000,
  retry: 0,
});
