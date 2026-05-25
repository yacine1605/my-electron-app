import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Trophy,
  Medal,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import {
  fetchOfferComparison,
  handleExportPricing,
} from "./hooks/services/api1";

export default function OfferRankingPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!offerId) return;
    fetchOfferComparison(offerId).then((res) => res.success && setData(res));
  }, [offerId]);

  if (!data) return <div className="p-8">Chargement...</div>;

  const ranked = [...data.suppliers].sort(
    (a: any, b: any) => (a.rank || 999) - (b.rank || 999),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Classement des fournisseurs
            </h1>
          </div>
          <button
            onClick={() =>
              handleExportPricing(offerId!).then((r) =>
                window.open(r.fileUrl, "_blank"),
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel de classement
          </button>
        </div>

        <div className="space-y-4">
          {ranked.map((supplier: any, index: number) => (
            <div
              key={supplier.supplierId}
              className={`bg-white rounded-xl border p-6 flex items-center gap-4 transition-shadow hover:shadow-md ${
                supplier.isBestSupplier
                  ? "border-amber-300 ring-1 ring-amber-200"
                  : "border-gray-200"
              }`}
            >
              <div
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-full shrink-0 ${
                  index === 0
                    ? "bg-amber-100 text-amber-700"
                    : index === 1
                      ? "bg-gray-100 text-gray-600"
                      : index === 2
                        ? "bg-orange-50 text-orange-700"
                        : "bg-gray-50 text-gray-400"
                }`}
              >
                {index === 0 ? (
                  <Trophy className="w-6 h-6" />
                ) : index === 1 ? (
                  <Medal className="w-6 h-6" />
                ) : index === 2 ? (
                  <Medal className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-bold">#{supplier.rank}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {supplier.supplierName}
                  </h3>
                  {!supplier.isEligible && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Non éligible
                    </span>
                  )}
                  {supplier.isBestSupplier && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                      Meilleure offre
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {supplier.summary}
                </p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Score global</div>
                  <div
                    className={`text-xl font-bold ${
                      supplier.globalScore >= 80
                        ? "text-emerald-600"
                        : supplier.globalScore >= 60
                          ? "text-blue-600"
                          : "text-amber-600"
                    }`}
                  >
                    {supplier.globalScore.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Total HT</div>
                  <div className="font-semibold text-gray-900">
                    {supplier.totalHT.toLocaleString("fr-FR")} DZD
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Technique</div>
                  <div className="font-medium text-gray-700">
                    {supplier.technicalScore.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Prix</div>
                  <div className="font-medium text-gray-700">
                    {supplier.priceScore.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Conditions</div>
                  <div className="font-medium text-gray-700">
                    {supplier.conditionsScore.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
