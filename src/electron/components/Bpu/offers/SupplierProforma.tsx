import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import OfferDocumentsManager from "./OfferDocumentsManager";
import { apiClient } from "@/lib/hooks/apiClient";

const API_BASE_URL = "https://api.digitservz.dz";

type ResponseAttachment = {
  id: string;
  supplierResponseId: string;
  attachmentType: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
};

type SupplierResponse = {
  id: string;
  supplierId: string;
  supplierName: string;
  emailFrom: string | null;
  emailSubject: string | null;
  status: string;
  isNegativeResponse: boolean;
  negativeReason: string | null;
  receivedAt: string;
  analyzedAt: string | null;
  attachmentCount: number;
  attachments: ResponseAttachment[];
  globalScore?: number;
};

type OfferWithResponses = {
  success: boolean;
  offerId: string;
  offerTitle: string;
  status: string;
  sentAt: string | null;
  supplierCount: number;
  respondedCount: number;
  responses: SupplierResponse[];
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function OfferResponsesPage({ offerId }: { offerId?: string }) {
  const navigate = useNavigate();

  const [data, setData] = useState<OfferWithResponses | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(
    new Set(),
  );

  const toggleAttachments = (responseId: string) => {
    setExpandedAttachments((prev) => {
      const next = new Set(prev);
      if (next.has(responseId)) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  };

  useEffect(() => {
    if (!offerId) return;
    load();
  }, [offerId]);

  async function load() {
    setLoading(true);
    try {
      const json = await apiClient
        .get(`offers/${offerId}/responses`)
        .json<OfferWithResponses>();
      setData(json);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert("Vous n'avez pas accès à cette offre.");
      }
      console.error("Erreur chargement réponses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      await apiClient.post(`pipeline/offers/${offerId}/full-run`);
      await load();
    } catch (error) {
      console.error("Analyse échouée:", error);
    } finally {
      setAnalyzing(false);
    }
  }

  const bestSupplier = useMemo(() => {
    if (!data) return null;
    return [...data.responses]
      .filter((r) => !r.isNegativeResponse)
      .sort((a, b) => (b.globalScore || 0) - (a.globalScore || 0))[0];
  }, [data]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Réponses fournisseurs</h1>
            <p className="text-gray-500">{data.offerTitle}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/offer/liste/${offerId}/compare`)}
              className="rounded-lg border px-4 py-2"
            >
              Comparer
            </button>
            <button
              onClick={() => navigate(`/offer/liste/${offerId}/ranking`)}
              className="rounded-lg border px-4 py-2"
            >
              Classement
            </button>
            <button
              onClick={() => navigate(`/offer/liste/${offerId}/analysis`)}
              className="rounded-lg border px-4 py-2"
            >
              Analyse
            </button>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      {/* <div className="flex gap-3">
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          {analyzing ? "Analyse..." : "Lancer analyse IA"}
        </button>
      </div> */}

      {/* BEST SUPPLIER */}
      {bestSupplier && (
        <div className="rounded-xl border bg-green-50 p-6">
          <h2 className="text-lg font-bold text-green-700">
            🏆 Meilleure offre
          </h2>
          <p className="text-xl font-semibold">{bestSupplier.supplierName}</p>
          <p className="text-sm text-gray-600">
            Score: {bestSupplier.globalScore || 0}/100
          </p>
        </div>
      )}

      <OfferDocumentsManager
        offerId={offerId!}
        onSelectionChange={(files) => {
          console.log("Fichiers sélectionnés:", files);
        }}
      />

      {/* LIST */}
      <div className="space-y-6">
        <div className="space-y-4">
          {data.responses.map((r) => {
            const isOpen = expandedAttachments.has(r.id);
            return (
              <div key={r.id} className="rounded-xl border bg-white p-5">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold">
                      {r.supplierName || "Fournisseur inconnu"}
                    </h3>
                    <p className="text-sm text-gray-500">{r.emailSubject}</p>
                    <p className="text-xs text-gray-400">
                      Reçu le {formatDate(r.receivedAt)}
                    </p>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        Statut: {r.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        Pièces jointes: {r.attachmentCount ?? 0}
                      </span>
                    </div>
                  </div>
                  <button className="h-fit rounded-lg border px-3 py-1 text-sm">
                    Détails
                  </button>
                </div>

                {/* ─── PIÈCES JOINTES REPLIABLES ─── */}
                {r.attachments && r.attachments.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleAttachments(r.id)}
                      className="flex w-full items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-semibold">
                        Pièces jointes ({r.attachments.length})
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-gray-500 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="mt-2 space-y-2">
                        {r.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.originalFileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Type: {attachment.attachmentType} · Taille:{" "}
                                {formatFileSize(attachment.fileSize)}
                              </p>
                            </div>
                            <a
                              href={`${API_BASE_URL}/api/offers/${offerId}/responses/${r.id}/attachments/${attachment.id}/download`}
                              className="ml-3 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                            >
                              Télécharger
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(!r.attachments || r.attachments.length === 0) && (
                  <p className="mt-3 text-sm text-gray-400">
                    Aucune pièce jointe pour cette réponse.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
