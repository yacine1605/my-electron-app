export interface Invoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  tva: number;
  totalTTC: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAt: string | null;
  paidAmount: number;
  filePath: string | null;
  notes: string;
}

export type InvoiceStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: "bank_transfer" | "check" | "cash" | "other";
  reference: string;
  paidAt: string;
  notes: string;
}
