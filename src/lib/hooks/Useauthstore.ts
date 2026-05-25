import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HTTPError } from "ky";
import { api } from "../api";

export type UserRole =
  | "admin"
  | "accountant"
  | "technique"
  | "agent_commercial"
  | "distributor";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  signature?: string;
  company?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Setters
  setHasHydrated: (state: boolean) => void;

  // Actions
  login: (email: string, password: string) => Promise<string | void>;
  logout: () => void;
  fetchUser: () => Promise<void>;

  // Role helpers  (use these in components instead of comparing strings directly)
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  isTechnique: () => boolean;
  isAgentCommercial: () => boolean;
  isDistributor: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (email, password) => {
        try {
          const response = await api.post<{ token: string; user: User }>(
            "auth/login",
            { json: { email, password } },
          );
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
          });
        } catch (error: any) {
          if (error instanceof HTTPError) {
            try {
              const errorData = await error.response.json<{
                error?: string;
                message?: string;
              }>();
              return (
                errorData.error ||
                errorData.message ||
                "Identifiants incorrects"
              );
            } catch {
              return "Erreur serveur illisible";
            }
          }
          return "Erreur de connexion au serveur";
        }
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      fetchUser: async () => {
        try {
          const user = await api.get<User>("auth/me");
          set({ user });
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
        }
      },

      // ── Role helpers ──────────────────────────────────────────────────────

      hasRole: (role) => {
        const userRole = get().user?.role;
        if (!userRole) return false;
        return Array.isArray(role)
          ? role.includes(userRole)
          : userRole === role;
      },

      isAdmin: () => get().user?.role === "admin",
      isAccountant: () => get().user?.role === "accountant",
      isTechnique: () => get().user?.role === "technique",
      isAgentCommercial: () => get().user?.role === "agent_commercial",
      isDistributor: () => get().user?.role === "distributor",
    }),
    {
      name: "fk-pharm-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
