import ky from "ky";
import { useAuthStore } from "./hooks/useAuth";

const API_BASE_URL = "http://localhost:5000/api";

// Fonction utilitaire pour récupérer le header d'auth dynamiquement
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Création de l'instance de base (sans les hooks problématiques)
const kyInstance = ky.create({
  prefix: API_BASE_URL,
});

// Notre objet API qui injecte le token à chaque appel
export const api = {
  get: <T>(url: string, options?: any) =>
    kyInstance.get(url, { ...options, headers: getAuthHeaders() }).json<T>(),

  post: <T>(url: string, data: any, options?: any) =>
    kyInstance
      .post(url, { ...options, json: data, headers: getAuthHeaders() })
      .json<T>(),

  put: <T>(url: string, data: any, options?: any) =>
    kyInstance
      .put(url, { ...options, json: data, headers: getAuthHeaders() })
      .json<T>(),

  delete: <T>(url: string, options?: any) =>
    kyInstance.delete(url, { ...options, headers: getAuthHeaders() }).json<T>(),
};
