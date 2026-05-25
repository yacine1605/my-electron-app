// src/lib/hooks/useOffer.ts
import { useQuery } from "@tanstack/react-query";

export type OfferAttachment = {
  path: string;
  name: string;
  size: number;
};

export type OfferDetail = {
  id: string;
  title: string;
  status: string;
  emailSubject: string;
  emailBody: string;
  emailSignature: string;
  createdAt: string;
  attachment: OfferAttachment | null;
  medicalEntity: {
    name: string;
    type: string;
    speciality: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  offerRecipients: Array<{
    id: string;
    recipientEmail: string;
    recipientName: string;
    status: string;
  }>;
};
const API_BASE = "https://api.digitservz.dz/api";

export function useOffer(offerId?: string) {
  return useQuery({
    queryKey: ["offer", offerId],
    enabled: Boolean(offerId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/offers/${offerId}`);

      if (!response.ok) {
        throw new Error("Impossible de charger l'offre.");
      }

      const json = await response.json();

      return json.data as OfferDetail;
    },
  });
}
