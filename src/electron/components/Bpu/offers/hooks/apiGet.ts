import { OfferDetail } from "./useOffer";

const env = typeof process !== "undefined" ? process.env : {};
export const VITE_API_BASE_URL = env.VITE_API_BASE_URL ?? ""; // e.g. "http://localhost:3001" or "" if using proxy

// ← ajoutez ceci en haut du fichier
function getToken(): string | null {
  try {
    const raw = localStorage.getItem("fk-pharm-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ← remplacez queryFn par :
queryFn: async (offerId: string) => {
  const token = getToken();
  const res = await fetch(`${VITE_API_BASE_URL}offers/${offerId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  if (!res.ok) {
    throw new Error("Impossible de charger l'offre.");
  }

  const json = await res.json();
  return json.data as OfferDetail;
};
