export interface BPUTemplate {
  id: string;
  name: string;
  description: string;
  filePath: string;
  fields: BPUField[];
  createdAt: string;
  updatedAt: string;
}

export interface BPUField {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required: boolean;
  defaultValue?: string;
  mapping?: string;
}

export interface BPUDocument {
  id: string;
  templateId: string;
  templateName: string;
  type: "BPU" | "DGE";
  status: "draft" | "validated" | "exported";
  data: Record<string, unknown>;
  items: BPUDocumentItem[];
  generatedAt: string;
  exportedAt: string | null;
  filePath: string | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export interface BPUDocumentItem {
  numero: number;
  designation: string;
  reference: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}
