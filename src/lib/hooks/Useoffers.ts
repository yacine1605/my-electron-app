import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

/* ═══════════════════════════════════════════════════════════════════
   SCHEMA-DRIVEN TYPES — alignés avec drizzle schema
   ═══════════════════════════════════════════════════════════════════ */

export interface MedicalEntity {
  id: string;
  name: string;
  type: string;
  address: string | null;
  city: string;
  phone: string | null;
  phone2: string | null;
  email: string;
  contactPerson: string;
  serviceToContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferLot {
  id: string;
  offerId: string;
  lotNumber: string;
  lotObject: string;
  technicalDocuments: {
    hasTechnicalSheet: boolean;
    hasConformityCertificate: boolean;
    hasOriginCertificate: boolean;
    hasManufacturingCertificate: boolean;
    hasCatalog: boolean;
    hasUserManual: boolean;
    hasSample: boolean;
  };
  clientRequirements: {
    particularPrescriptions: string;
    warrantyDuration: string;
    deliveryDelay: string;
    savDuration: string;
    interventionDelay: string;
    savLocations: string;
    trainingDuration: string;
  };
}

export type OfferStatus =
  | "draft"
  | "pending"
  | "sent"
  | "partial_failed"
  | "failed"
  | "completed";

export type ProcedureType = "appel_offre" | "consultation";

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OfferRecipient {
  id: string;
  recipientId: string;
  recipient: Recipient;
  status: "pending" | "sent" | "failed";
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface OfferAttachment {
  id: string;
  offerId: string;
  fileName: string;
  filePath: string;
  attachmentType: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

/* ── Réponse API /offers (liste) ── */
export interface OfferSummary {
  id: string;
  title: string;
  status: OfferStatus;
  emailSubject: string;
  emailBody: string;
  emailSignature: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  medicalEntityId: string;
  medicalEntity: Pick<MedicalEntity, "id" | "name" | "city" | "type">;
  offerRecipients: OfferRecipient[];
  attachmentName: string | null;
  attachmentPath: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  attachmentUrl: string | null;
  hasAttachment: boolean;
}

/* ── Détail complet /offers/:id ── */
export interface OfferDetail extends OfferSummary {
  /* ── En-tête ── */
  commercialName: string | null;
  consultationNumber: string | null;
  establishment: string | null;
  wilaya: string | null;
  depositLocation: string | null;
  procedureType: ProcedureType | null;
  hospitalDepositDate: string | null;
  technicalDepartmentDepositDate: string | null;

  /* ── Documents requis (checkboxes) ── */
  hasTechnicalSheet: boolean | null;
  hasConformityCertificate: boolean | null;
  hasOriginCertificate: boolean | null;
  hasManufacturingCertificate: boolean | null;
  hasUserManual: boolean | null;
  hasCatalog: boolean | null;
  hasSample: boolean | null;

  /* ── Prescriptions ── */
  warrantyDuration: string | null;
  deliveryDelay: string | null;
  savDuration: string | null;
  interventionDelay: string | null;
  savLocations: string | null;
  trainingDuration: string | null;

  /* ── Suivi commercial ── */
  maintenanceWorkshop: string | null;
  availableTechnicalMeans: string | null;
  proformaInvoice: string | null;
  paymentSchedule: string | null;
  discountObtained: string | null;
  offerExpirationDate: string | null;
  ddpConditions: string | null;

  /* ── Suivi Dossier (PVs & Cautions) ── */
  siteVisitPv: boolean | null;
  pliOpeningPv: boolean | null;
  provisionalAttributionPv: boolean | null;
  definitiveAttributionPv: boolean | null;
  justiceFolder: boolean | null;
  submissionBond: boolean | null;
  goodExecutionBond: boolean | null;

  /* ── Relations ── */
  medicalEntity: MedicalEntity;
  lots: OfferLot[];
  offerAttachments: OfferAttachment[];
  supplierCommercialAudit: string | null;
}

/* ── Stats ── */
export interface StatsData {
  total: number;
  pending: number;
  draft: number;
  failed: number;
}

/* ═══════════════════════════════════════════════════════════════════
   FETCHERS
   ═══════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════ */

export function useOffers() {
  return useQuery<OfferSummary[]>({
    queryKey: ["offers"],
    queryFn: () => fetchJson<OfferSummary[]>("offers"),
  });
}

/* ── RESTAURÉ : utilisé par DashboardAccountantPage.tsx ── */
export function useOfferst() {
  return useQuery<OfferSummary[]>({
    queryKey: ["offers", "list"],
    queryFn: () => fetchJson<OfferSummary[]>("offers"),
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
