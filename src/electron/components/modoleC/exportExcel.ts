import * as XLSX from "xlsx";
import { Supplier } from "../../types/supplier";

export function exportSuppliersToExcel(suppliers: Supplier[]) {
  const rows = suppliers.map((s) => ({
    Nom: s.name,
    RC: s.registrationNumber || "",
    Type: s.businessType || "",
    Email: s.email || "",
    Téléphone: s.phone || "",
    Adresse: s.address || "",
    Ville: s.city || "",
    Pays: s.country || "",
    Contact: s.contactPerson || "",
    "Conditions Paiement": s.paymentTerms || "",
    Statut: s.isActive ? "Actif" : "Inactif",
    Note: s.rating || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");

  // Auto-width columns
  const colWidths = [
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 8 },
  ];
  ws["!cols"] = colWidths;

  XLSX.writeFile(
    wb,
    `Fournisseurs_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}
