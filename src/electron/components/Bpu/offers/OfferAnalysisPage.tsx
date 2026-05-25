import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Bot,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  fetchProformaSummary,
  exportPricingExcel,
} from "./hooks/services/api1";

export default function OfferAnalysisPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!offerId) return;
    fetchProformaSummary(offerId).then((res) => {
      if (res.success) setData(res);
      setLoading(false);
    });
  }, [offerId]);

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!data) return <div className="p-8">Aucune donnée</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analyse détaillée
              </h1>
              <p className="text-sm text-gray-500">{data.offerTitle}</p>
            </div>
          </div>
          <button
            onClick={() =>
              exportPricingExcel(offerId!).then((r) =>
                window.open(r.fileUrl, "_blank"),
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exporter Excel
          </button>
        </div>

        <div className="grid gap-6">
          {data.suppliers.map((supplier: any) => (
            <div
              key={supplier.supplierId}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {supplier.supplierName}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>
                      Conformité moyenne :{" "}
                      <strong className="text-gray-700">
                        {supplier.averageConformity.toFixed(1)}%
                      </strong>
                    </span>
                    <span>
                      Total HT :{" "}
                      <strong className="text-gray-700">
                        {supplier.totalHT.toLocaleString("fr-FR")} DZD
                      </strong>
                    </span>
                    {!supplier.hasAnalysis && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Analyse IA non
                        disponible
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    supplier.averageConformity >= 70
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {supplier.averageConformity >= 70 ? (
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                  )}
                  {supplier.averageConformity >= 70 ? "Éligible" : "À vérifier"}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {supplier.items.map((item: any) => (
                  <div key={item.offerItemId} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          Lot {item.itemNumber} — {item.requestedName}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          Proposé :{" "}
                          <span className="text-gray-700 font-medium">
                            {item.proposedName}
                          </span>{" "}
                          {item.proposedBrand && `(${item.proposedBrand})`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {item.unitPriceHT.toLocaleString("fr-FR")} DZD
                        </div>
                        <div className="text-xs text-gray-500">
                          Qté : {item.quantity} • Total HT :{" "}
                          {item.totalHT.toLocaleString("fr-FR")} DZD
                        </div>
                      </div>
                    </div>

                    {/* Conformity bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.conformityPercentage >= 80
                            ? "bg-emerald-500"
                            : item.conformityPercentage >= 50
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${item.conformityPercentage}%` }}
                      />
                    </div>

                    {/* AI Summary */}
                    {item.aiSummary && (
                      <div className="flex items-start gap-2 bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800">
                        <Bot className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">IA :</span>{" "}
                          {item.aiSummary}
                          {item.aiRecommendation && (
                            <div className="mt-1 text-indigo-600 italic">
                              {item.aiRecommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Technical requirements details */}
                    {item.analysisDetails?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {item.analysisDetails.map((req: any, idx: number) => (
                          <div
                            key={idx}
                            className={`text-xs rounded-lg border p-2 ${
                              req.matched
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-red-50 border-red-200 text-red-700"
                            }`}
                          >
                            <div className="font-medium truncate">
                              {req.requirementLabel}
                            </div>
                            <div className="mt-1 opacity-90">
                              {req.matched ? "✓ Conforme" : "✗ Non conforme"} •
                              Score : {req.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
