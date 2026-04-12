import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HTTPError } from "ky"; // Importation du type d'erreur de ky
import { api } from "../api";

export type UserRole = "admin" | "accountant";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<string | void>; // Retourne un message d'erreur ou rien
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: true,

      login: async (email, password) => {
        try {
          const response = await api.post<{ token: string; user: User }>(
            "auth/login",
            { email, password },
          );

          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
          });

          return; // Succès, on ne retourne rien
        } catch (error: any) {
          // Si c'est une erreur HTTP (ex: 401, 400), on extrait le message du backend
          if (error instanceof HTTPError) {
            try {
              const errorData = await error.response.json<{
                error?: string;
                message?: string;
              }>();
              const serverMessage =
                errorData.error ||
                errorData.message ||
                "Identifiants incorrects";
              console.error("Erreur Backend:", serverMessage);
              return serverMessage; // On retourne le message pour l'afficher dans l'UI
            } catch {
              return "Erreur serveur illisible";
            }
          }

          console.error("Erreur réseau:", error);
          return "Erreur de connexion au serveur";
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "fk-pharm-auth",
    },
  ),
);
