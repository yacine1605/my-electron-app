export interface Supplier {
  isActive: any;
  id: string;
  name: string;
  registrationNumber: string;
  paymentTerms: string;
  contactPerson: string;
  businessType: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  category: SupplierCategory;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "inactive" | "blacklisted";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type SupplierCategory =
  | "imaging"
  | "laboratory"
  | "surgical"
  | "dental"
  | "consumables"
  | "furniture"
  | "ict"
  | "other";

export const SUPPLIER_CATEGORIES: Record<
  SupplierCategory,
  { label: string; color: string }
> = {
  imaging: { label: "Imagerie Médicale", color: "blue" },
  laboratory: { label: "Laboratoire", color: "purple" },
  surgical: { label: "Chirurgie", color: "red" },
  dental: { label: "Dentaire", color: "cyan" },
  consumables: { label: "Consommables", color: "green" },
  furniture: { label: "Mobilier Médical", color: "amber" },
  ict: { label: "Informatique", color: "indigo" },
  other: { label: "Autre", color: "gray" },
};
