export interface Offer {
  id: string;
  supplierId: string;
  supplierName: string;
  fileName: string;
  filePath: string;
  fileType: "pdf" | "excel" | "image";
  status: OfferStatus;
  importedAt: string;
  analyzedAt: string | null;
  items: OfferItem[];
  totalAmount: number;
  currency: string;
  notes: string;
}

export type OfferStatus =
  | "imported"
  | "analyzing"
  | "analyzed"
  | "compared"
  | "selected"
  | "rejected"
  | "error";

export interface OfferItem {
  id: string;
  offerId: string;
  designation: string;
  description: string;
  reference: string;
  brand: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unit: string;
  specifications: Record<string, string>;
  matchScore?: number;
  matchedItemId?: string;
}

export interface ComparisonResult {
  id: string;
  designation: string;
  items: ComparisonItem[];
  bestOfferId: string;
  bestReason: string;
}

export interface ComparisonItem {
  offerId: string;
  supplierId: string;
  supplierName: string;
  item: OfferItem;
  priceRank: number;
  specScore: number;
  overallScore: number;
}
