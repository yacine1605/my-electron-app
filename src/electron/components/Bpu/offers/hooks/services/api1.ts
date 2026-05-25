import { ComparisonResponse } from "../types/offer";

const API_BASE = "https://api.digitservz.dz/api";

export async function fetchOfferComparison(
  offerId: string,
): Promise<ComparisonResponse> {
  const res = await fetch(`${API_BASE}/excel/offers/${offerId}/comparison`);
  if (!res.ok) throw new Error("Failed to fetch comparison");
  return res.json();
}

export async function fetchProformaSummary(offerId: string) {
  const res = await fetch(
    `${API_BASE}/excel/offers/${offerId}/proforma-summary`,
  );
  if (!res.ok) throw new Error("Failed to fetch proforma summary");
  return res.json();
}

export async function exportPricingExcel(offerId: string): Promise<{
  success: boolean;
  fileName: string;
  fileUrl: string;
}> {
  const res = await fetch(
    `${API_BASE}/excel/offers/${offerId}/export-pricing`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Excel export failed");
  return res.json();
}
export const handleExportPricing = async (offerId: string) => {
  const res = await fetch(
    `${API_BASE}/excel/offers/${offerId}/export-pricing`,
    {
      method: "POST",
    },
  );
  const data = await res.json();

  if (data.success) {
    // Point to backend port, not frontend
    const backendUrl = `https://api.digitservz.dz${data.fileUrl}`;

    const a = document.createElement("a");
    a.href = backendUrl;
    a.download = data.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
export async function runFullAnalysis(
  offerId: string,
  overwriteOfferItems = false,
) {
  const res = await fetch(`${API_BASE}/pipeline/offers/${offerId}/full-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overwriteOfferItems }),
  });
  if (!res.ok) throw new Error("Analysis pipeline failed");
  return res.json();
}

export async function runOfferAnalysis(offerId: string) {
  const res = await fetch(`${API_BASE}/pipeline/offers/${offerId}/run`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Offer analysis failed");
  return res.json();
}
