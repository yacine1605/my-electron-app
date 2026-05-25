// Match your Drizzle schema + API responses
// ─── Database / Core Types ───

export interface OfferItem {
  id: string;
  itemNumber: number;
  name: string;
  code: string | null;
  description: string | null;
  requestedQuantity: number;
  minConformityPercentage: number;
  category?: string | null;
  specifications?: Record<string, any> | null;
  technicalRequirements?: {
    label: string;
    required: boolean;
    weight: number;
    acceptedValues?: string[];
    minValue?: number;
    maxValue?: number;
    unit?: string;
  }[];
}

export interface AnalysisDetail {
  requirementLabel: string;
  required: boolean;
  matched: boolean;
  score: number;
  comment?: string;
}

export interface SupplierItemAnalysis {
  offerItemId: string;
  itemNumber?: number;
  requestedName?: string;
  requestedQuantity?: number;
  proposedName: string;
  proposedBrand: string | null;
  proposedCode?: string | null;
  quantityOffered: number | null;
  unitPriceHT: number;
  totalHT: number;
  tvaPercentage?: number;
  conformityPercentage: number;
  isTechnicallyCompliant: boolean;
  status?: "completed" | "needs_review" | "raw" | "pending";
  aiSummary: string | null;
  aiRecommendation?: string | null;
  analysisDetails: AnalysisDetail[];
  manualOverride: boolean;
  manualConformityPercentage?: number | null;
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
  summary?: string | null;
  items: SupplierItemAnalysis[];
}

export interface ComparisonResponse {
  success: boolean;
  offerId: string;
  offerTitle: string;
  offerDescription?: string;
  medicalEntity: string | null;
  requestedItems: OfferItem[];
  suppliers: SupplierComparison[];
  bestSupplier: {
    supplierId: string;
    supplierName: string;
    globalScore: number;
    totalHT: number;
    rank: number | null;
    summary?: string | null;
  } | null;
  lastAnalyzedAt?: string | null;
}

// ─── Best Offer Export Types ───

export interface BestOfferLine {
  rowNumber: number;
  supplierName: string | null;
  lot: number | null;
  product: string;
  unitPrice: number;
  quantity: number;
  marginRate: number;
  tvaRate: number;
  isOnlineSearch: boolean;
  onlineSuppliers: string[];
  conformityPercentage: number;
  isTechnicallyCompliant: boolean;
  originalSupplierPrice: number;
  aiRecommendations: string;
}

export interface BestOfferResult {
  offerId: string;
  title: string;
  medicalEntityName: string | null;
  lines: BestOfferLine[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  missingItems: MissingItem[];
}

export interface MissingItem {
  itemNumber: number;
  itemName: string;
  onlineSuppliers: string[];
  aiRecommendations: string;
  classificationCategory: string;
}

export interface ExportResponse {
  fileName: string;
  filePath: string;
  fileUrl: string;
  summary: {
    totalItems: number;
    matchedItems: number;
    missingItems: number;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  };
  missingItems: {
    itemNumber: number;
    itemName: string;
    category: string;
    suppliersFound: number;
  }[];
}

// ─── AI Supplier Intelligence Types ───

export interface StructuredSupplier {
  companyName: string;
  legalForm: string | null;
  city: string | null;
  specialties: string[];
  confidence: number;
  isAlgerian: boolean;
  contactHint: string | null;
}

export interface SupplierRecommendation {
  name: string;
  reason: string;
  likelihood: "high" | "medium" | "low";
}

export interface EquipmentClassification {
  category:
    | "Diagnostic"
    | "Surgical"
    | "Emergency"
    | "Laboratory"
    | "Sterilization"
    | "Patient_Monitoring"
    | "Consumables"
    | "Imaging"
    | "Rehabilitation"
    | "Pharmaceutical";
  subcategory: string;
  frenchSearchTerms: string[];
  arabicSearchTerms?: string[];
  typicalSuppliers: string[];
}

export interface EnrichedSearchResult {
  suppliers: string[];
  structuredSuppliers: StructuredSupplier[];
  classification: EquipmentClassification;
  aiRecommendations: SupplierRecommendation[];
}

// ─── API Response Wrappers ───

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnalysisJobResponse {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
}
