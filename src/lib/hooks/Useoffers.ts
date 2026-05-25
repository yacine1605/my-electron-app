import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

export interface MedicalEntity {
  id: string;
  name: string;
  type: string;
  speciality: string;
  address: string | null;
  city: string;
  phone: string | null;
  email: string;
  contactPerson: string;
  recipientsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  offerRecipients: any;
  medicalEntity: any;
  id: string;
  title: string | null;
  status: "draft" | "pending" | "validated" | "rejected" | "sent" | "completed";
  entityName: string;
  entityType: string;
  city: string;
  recipientsCount: number;
  createdAt: string;
  hasAttachment: boolean;
}

// ── FIX: StatsData no longer has nested `data` ──
interface StatsData {
  total: number;
  pending: number;
  draft: number;
  failed: number;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
}

export interface OfferRecipient {
  id: string;
  recipient: Recipient;
}

export type OfferStatus =
  | "draft"
  | "pending"
  | "sent"
  | "partial_failed"
  | "failed"
  | "completed";

export interface OfferSummary {
  id: string;
  title: string;
  status: OfferStatus;
  emailSubject: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  medicalEntity: Pick<MedicalEntity, "id" | "name" | "city" | "type">;
  offerRecipients: OfferRecipient[];
}

export interface OfferDetail extends OfferSummary {
  emailBody: string;
  emailSignature: string;
  selectedTemplateId: string | null;
  attachmentName: string | null;
  attachment: string | null;
  attachmentPath: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  attachmentUrl: string | null;
  medicalEntity: MedicalEntity;
}

async function fetchJson<T>(url: string): Promise<T> {
  const json = await apiClient
    .get(url)
    .json<{ success: boolean; data: T; message?: string }>();
  if (!json.success) {
    throw new Error(json.message ?? "Erreur serveur");
  }
  return json.data;
}

async function fetchStats(): Promise<StatsData> {
  return fetchJson<StatsData>("offers/stats");
}

export function useOffers() {
  return useQuery<OfferSummary[]>({
    queryKey: ["offers"],
    queryFn: () => fetchJson<OfferSummary[]>("offers"),
  });
}

export function useOfferst() {
  return useQuery<Offer[]>({
    queryKey: ["offers", "list"],
    queryFn: () => fetchJson<Offer[]>("offers"),
    staleTime: 30_000,
  });
}

export function useOffer(id: string | null | undefined) {
  return useQuery<OfferDetail>({
    queryKey: ["offers", id],
    enabled: Boolean(id),
    queryFn: () => fetchJson<OfferDetail>(`offers/${id}`),
  });
}

export const useOfferStats = () => {
  return useQuery<StatsData>({
    queryKey: ["offers", "stats"],
    queryFn: fetchStats,
    staleTime: 30_000,
  });
};
