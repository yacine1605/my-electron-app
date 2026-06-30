// adjust path if your apiClient lives elsewhere

import { apiClient } from "../apiClient";

/**
 * API service layer - FK PHARM Medical Procurement System
 * Matches all backend endpoints exactly
 */

const API_BASE = "https://api.digitservz.dz";

/* ───────────────────────────────────────────
   TYPES
   ─────────────────────────────────────────── */

export interface OfferExportRecord {
  id: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  offerId: string;
  offerTitle: string | null;
  medicalEntityName: string | null;
  offerStatus:
    | "draft"
    | "pending"
    | "sent"
    | "partial_failed"
    | "failed"
    | "completed"
    | null;
}
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ComparisonResponse {
  offerId: string;
  offerTitle: string;
  offerDescription?: string;
  medicalEntity?: string;
  requestedItems: OfferItem[];
  suppliers: SupplierComparison[];
  bestSupplier: BestSupplier | null;
}

export interface OfferItem {
  id: string;
  itemNumber: number;
  name: string;
  code?: string | null;
  description?: string | null;
  requestedQuantity: number;
  technicalRequirements?: any[];
  minConformityPercentage: number;
}

export interface SupplierComparison {
  supplierId: string;
  supplierName: string;
  globalScore: number;
  technicalScore: number;
  priceScore: number;
  conditionsScore: number;
  rank: number | null;
  isBestSupplier: boolean;
  isEligible: boolean;
  totalHT: number;
  totalTTC: number;
  summary: string | null;
  items: SupplierItemAnalysis[];
}

export interface SupplierItemAnalysis {
  offerItemId: string;
  itemNumber: number;
  requestedName: string;
  requestedQuantity: number;
  proposedName: string;
  proposedBrand?: string | null;
  proposedCode?: string | null;
  quantityOffered?: number | null;
  unitPriceHT: number;
  totalHT: number;
  tvaPercentage: number;
  conformityPercentage: number | null;
  isTechnicallyCompliant: boolean | null;
  status: string;
  aiSummary?: string | null;
  aiRecommendation?: string | null;
  analysisDetails?: AnalysisDetail[];
  manualOverride: boolean;
}

export interface AnalysisDetail {
  requirementLabel: string;
  required: boolean;
  matched: boolean;
  score: number;
  comment?: string;
}

export interface BestSupplier {
  supplierId: string;
  supplierName: string;
  globalScore: number;
  totalHT: number;
  rank: number | null;
  summary: string | null;
}

export interface AnalysisJobResponse {
  jobId: string;
  status: "running" | "completed" | "failed";
  progress: number;
  error?: string;
}

export interface ExportResponse {
  fileName: string;
  fileUrl: string;
  summary?: {
    totalItems: number;
    matchedItems: number;
    missingItems: number;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  };
  missingItems?: MissingItem[];
}

export interface MissingItem {
  itemNumber: number;
  itemName: string;
  category?: string;
  suppliersFound?: number;
  onlineSuppliers?: string[];
  aiRecommendations?: string;
}

export interface EnrichedSearchResult {
  suppliers: string[];
  structuredSuppliers: StructuredSupplier[];
  classification: EquipmentClassification;
  aiRecommendations: SupplierRecommendation[];
}

export interface StructuredSupplier {
  companyName: string;
  legalForm: string | null;
  city: string | null;
  specialties: string[];
  confidence: number;
  isAlgerian: boolean;
  contactHint: string | null;
}

export interface EquipmentClassification {
  category: string;
  subcategory: string;
  frenchSearchTerms: string[];
  arabicSearchTerms?: string[];
  typicalSuppliers: string[];
}

export interface SupplierRecommendation {
  name: string;
  reason: string;
  likelihood: "high" | "medium" | "low";
}

export interface MissingItemsResponse {
  missingItemsCount: number;
  missingItems: Array<{
    itemNumber: number;
    itemName: string;
    suggestedSuppliers: string[];
    searchQuery: string;
  }>;
}

export interface BestOfferAnalysisResponse {
  offerId: string;
  title: string;
  medicalEntity: string | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  lines: BestOfferLine[];
  missingItems: MissingItem[];
}

export interface BestOfferLine {
  rowNumber: number;
  supplierName: string | null;
  lot: number | null;
  product: string;
  unitPrice: number;
  quantity: number;
  marginRate: number;
  tvaRate: number;
  unitPriceWithMargin: number;
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
  isOnlineSearch: boolean;
  conformityPercentage: number;
  isTechnicallyCompliant: boolean;
  onlineSuppliers: string[];
  originalSupplierPrice: number;
  aiRecommendations: string;
}

/* ───────────────────────────────────────────
   FETCHER
   ─────────────────────────────────────────── */

async function fetcher<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const token = localStorage.getItem("token");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers: defaultHeaders,
    credentials: "include",
    ...options,
  });

  // Handle non-JSON responses (like file downloads)
  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    // For non-JSON success responses, wrap in ApiResponse shape
    return { success: true } as ApiResponse<T>;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }

  return data;
}

/* ───────────────────────────────────────────
   OFFER COMPARISON
   ─────────────────────────────────────────── */

export async function fetchOfferComparison(
  offerId: string,
): Promise<ComparisonResponse> {
  const res = await fetcher<ComparisonResponse>(
    `/api/offers/${offerId}/comparison`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to load comparison");
  }
  return res.data;
}

/* ───────────────────────────────────────────
   ANALYSIS PIPELINE
   ─────────────────────────────────────────── */

export async function runFullAnalysis(
  offerId: string,
  force: boolean = false,
): Promise<AnalysisJobResponse> {
  const res = await fetcher<AnalysisJobResponse>(
    `/api/offers/${offerId}/analyze`,
    {
      method: "POST",
      body: JSON.stringify({ force }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Analysis failed");
  }
  return res.data;
}

export async function pollAnalysisStatus(
  offerId: string,
  jobId: string,
): Promise<AnalysisJobResponse> {
  const res = await fetcher<AnalysisJobResponse>(
    `/api/offers/${offerId}/analyze/${jobId}/status`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Poll failed");
  }
  return res.data;
}

/* ───────────────────────────────────────────
   EXPORTS & BEST OFFER
   ─────────────────────────────────────────── */

export async function exportPricingExcel(
  offerId: string,
): Promise<ExportResponse> {
  const res = await fetcher<ExportResponse>(`/api/offers/${offerId}/export`, {
    method: "POST",
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || "Export failed");
  }
  return res.data;
}

export async function generateBestOfferPreview(offerId: string): Promise<{
  lines: BestOfferLine[];
  missingCount: number;
  totalHT: number;
  missingItems: MissingItem[];
}> {
  const res = await fetcher<{
    lines: BestOfferLine[];
    missingCount: number;
    totalHT: number;
    missingItems: MissingItem[];
  }>(`/api/offers/${offerId}/export/preview`, { method: "POST" });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Preview failed");
  }
  return res.data;
}

export async function generateBestOfferExcel(
  offerId: string,
): Promise<ExportResponse> {
  // Alternative endpoint via best-offer router
  const res = await fetcher<ExportResponse>(
    `/api/best-offer/offers/${offerId}/generate`,
    { method: "POST" },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Best offer generation failed");
  }
  return res.data;
}

export async function fetchBestOfferAnalysis(
  offerId: string,
): Promise<BestOfferAnalysisResponse> {
  const res = await fetcher<BestOfferAnalysisResponse>(
    `/api/best-offer/offers/${offerId}/analysis`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to load best offer analysis");
  }
  return res.data;
}

/* ───────────────────────────────────────────
   MISSING ITEMS
   ─────────────────────────────────────────── */

export async function fetchMissingItems(
  offerId: string,
): Promise<MissingItemsResponse> {
  const res = await fetcher<MissingItemsResponse>(
    `/api/offers/${offerId}/missing-items`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to load missing items");
  }
  return res.data;
}

export async function regenerateMissingItems(
  offerId: string,
): Promise<{ message: string; data?: any[] }> {
  const res = await fetcher<{ message: string; data?: any[] }>(
    `/api/offers/${offerId}/regenerate-missing`,
    { method: "POST" },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Regeneration failed");
  }
  return res.data;
}

/* ───────────────────────────────────────────
   AI SUPPLIER INTELLIGENCE
   ─────────────────────────────────────────── */

export async function searchOnlineSuppliersAI(
  itemName: string,
  maxResults: number = 8,
): Promise<EnrichedSearchResult> {
  const res = await fetcher<EnrichedSearchResult>(`/api/suppliers/search-ai`, {
    method: "POST",
    body: JSON.stringify({ itemName, maxResults }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || "Search failed");
  }
  return res.data;
}

export async function classifyEquipment(
  description: string,
): Promise<EquipmentClassification> {
  const res = await fetcher<EquipmentClassification>(
    `/api/equipment/classify`,
    {
      method: "POST",
      body: JSON.stringify({ description }),
    },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || "Classification failed");
  }
  return res.data;
}

export async function generateOptimizedQueries(
  equipmentName: string,
  categoryHint?: string,
  count: number = 4,
): Promise<string[]> {
  const res = await fetcher<string[]>(`/api/equipment/search-queries`, {
    method: "POST",
    body: JSON.stringify({ equipmentName, categoryHint, count }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || "Query generation failed");
  }
  return res.data;
}
export async function updateOfferStatus(
  offerId: string,
  status:
    | "draft"
    | "pending"
    | "sent"
    | "partial_failed"
    | "failed"
    | "completed",
): Promise<{ success: boolean; message: string }> {
  const res = await fetcher<{ message: string }>(
    `/api/offers/${offerId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    },
  );
  if (!res.success) {
    throw new Error(res.error || "Status update failed");
  }
  return { success: true, message: res.data?.message || "Updated" };
}
/* ───────────────────────────────────────────
   FILE DOWNLOADS
   ─────────────────────────────────────────── */

export function getExportDownloadUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

export function getFileDownloadUrl(attachmentId: string): string {
  return `${API_BASE}/api/files/${attachmentId}`;
}

export async function fetchAllOfferExports(): Promise<OfferExportRecord[]> {
  const res = await fetcher<OfferExportRecord[]>("/api/excel/exports");
  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to load exports");
  }
  return res.data; // ← now correctly typed as OfferExportRecord[]
}
/* ───────────────────────────────────────────
   FULL PIPELINE (Alternative)
   ─────────────────────────────────────────── */

export async function runFullPipeline(
  offerId: string,
  overwriteOfferItems: boolean = false,
): Promise<any> {
  const res = await fetcher<any>(`/api/pipeline/offers/${offerId}/full-run`, {
    method: "POST",
    body: JSON.stringify({ overwriteOfferItems }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || "Pipeline failed");
  }
  return res.data;
}

/* ───────────────────────────────────────────
   LIBRARY DOCUMENTS (ky / apiClient)
   ─────────────────────────────────────────── */

export type DocumentCategory = "legal" | "tax" | "commercial";

export interface LibraryDocument {
  id: string;
  offerId: string;
  category: DocumentCategory;
  docType: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface OfferOption {
  id: string;
  title: string;
}

export async function fetchOffers(): Promise<OfferOption[]> {
  const res = await apiClient.get("offers").json<ApiResponse<any[]>>();
  if (!res.success || !res.data) {
    throw new Error(res.error || "Erreur chargement des offres.");
  }
  return res.data.map((item: any) => ({
    id: item.id,
    title: item.title || item.emailSubject || "Offre sans titre",
  }));
}

export async function fetchLibraryDocuments(
  offerId: string,
): Promise<LibraryDocument[]> {
  const res = await apiClient
    .get(`offers/${offerId}/library-documents`)
    .json<ApiResponse<LibraryDocument[]>>();
  if (!res.success || !res.data) {
    throw new Error(res.error || "Erreur chargement des documents.");
  }
  return res.data;
}

export async function uploadLibraryDocuments(
  offerId: string,
  formData: FormData,
): Promise<void> {
  const res = await apiClient
    .post(`offers/${offerId}/library-documents`, {
      body: formData,
    })
    .json<ApiResponse<unknown>>();
  if (!res.success) {
    throw new Error(res.error || "Import impossible.");
  }
}

export async function deleteLibraryDocument(
  offerId: string,
  documentId: string,
): Promise<void> {
  const res = await apiClient
    .delete(`offers/${offerId}/library-documents/${documentId}`)
    .json<ApiResponse<unknown>>();
  if (!res.success) {
    throw new Error(res.error || "Suppression impossible.");
  }
}

export async function downloadLibraryDocument(
  offerId: string,
  documentId: string,
  filename: string,
): Promise<void> {
  const blob = await apiClient
    .get(`offers/${offerId}/library-documents/${documentId}/download`)
    .blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportLibraryDocumentsZip(
  offerId: string,
  categoryFilter?: DocumentCategory,
): Promise<void> {
  const suffix = categoryFilter ? `?category=${categoryFilter}` : "";
  const filename = categoryFilter
    ? `documents-${categoryFilter}-${offerId}.zip`
    : `documents-offre-${offerId}.zip`;
  const blob = await apiClient
    .get(`offers/${offerId}/library-documents-export${suffix}`)
    .blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
