// hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
export interface Recipient {
  id: string;
  name: string; // mapped from firstName + lastName
  email: string;
  role: string | null;
}

const API_BASE_URL = "https://api.digitservz.dz/api";
// hooks/useUsers.ts
async function fetchStaff(): Promise<Recipient[]> {
  const res = await fetch(`${API_BASE_URL}/users/staff`);
  if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs");
  const json: { data: Recipient[] } = await res.json();
  return json.data; // already shaped as { id, email, role, name }
}

export function useAccountants() {
  return useQuery({
    queryKey: ["users", "staff"],
    queryFn: fetchStaff,
    staleTime: 1000 * 60 * 5,
  });
}
