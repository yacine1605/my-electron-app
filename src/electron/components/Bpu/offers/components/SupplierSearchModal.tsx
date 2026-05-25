import { useState, useEffect } from "react";
import {
  X,
  Search,
  Loader2,
  MapPin,
  Building2,
  Phone,
  Wand2,
  BrainCircuit,
  CheckCircle2,
  Globe,
  AlertTriangle,
} from "lucide-react";
import type { OfferItem, EnrichedSearchResult } from "../hooks/services/api";

interface SupplierSearchModalProps {
  item: OfferItem;
  searchResult?: EnrichedSearchResult;
  onClose: () => void;
  onSearch: () => Promise<void>;
}

export function SupplierSearchModal({
  item,
  searchResult,
  onClose,
  onSearch,
}: SupplierSearchModalProps) {
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      await onSearch();
    } finally {
      setSearching(false);
    }
  };

  // Auto-search on first open if no results
  useEffect(() => {
    if (!searchResult && !searching) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              Recherche de fournisseurs
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {item.name} (Lot {item.itemNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {searching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600 font-medium">
                Recherche en cours avec IA...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Analyse des fournisseurs algériens de matériel médical
              </p>
            </div>
          ) : !searchResult ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Aucun résultat de recherche
              </p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Lancez une recherche IA pour trouver des fournisseurs adaptés à
                cet article.
              </p>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium mx-auto transition-colors"
              >
                <Search className="w-4 h-4" />
                Lancer la recherche
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Classification */}
              {searchResult.classification && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-indigo-500" />
                    Classification IA
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
                      {searchResult.classification.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {searchResult.classification.subcategory}
                    </span>
                  </div>
                  {searchResult.classification.frenchSearchTerms &&
                    searchResult.classification.frenchSearchTerms.length >
                      0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {searchResult.classification.frenchSearchTerms.map(
                          (term, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded"
                            >
                              {term}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                </div>
              )}

              {/* Suppliers List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Fournisseurs identifiés (
                  {searchResult.structuredSuppliers?.length ||
                    searchResult.suppliers?.length ||
                    0}
                  )
                </h3>

                {searchResult.structuredSuppliers &&
                searchResult.structuredSuppliers.length > 0 ? (
                  <div className="space-y-2">
                    {searchResult.structuredSuppliers.map((supplier, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {supplier.legalForm
                                ? `${supplier.legalForm} `
                                : ""}
                              {supplier.companyName}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              {supplier.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {supplier.city}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Confiance:{" "}
                                {(supplier.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          {supplier.isAlgerian && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded font-medium shrink-0">
                              🇩🇿 Algérie
                            </span>
                          )}
                        </div>

                        {supplier.specialties &&
                          supplier.specialties.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {supplier.specialties.map((spec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                        {supplier.contactHint && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {supplier.contactHint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : searchResult.suppliers &&
                  searchResult.suppliers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {searchResult.suppliers.map((supplier, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200"
                      >
                        {supplier}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Aucun fournisseur identifié pour cet article.
                  </div>
                )}
              </div>

              {/* AI Recommendations */}
              {searchResult.aiRecommendations &&
                searchResult.aiRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      Recommandations IA
                    </h3>
                    <div className="space-y-2">
                      {searchResult.aiRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`border rounded-lg p-3 ${
                            rec.likelihood === "high"
                              ? "border-emerald-200 bg-emerald-50/50"
                              : rec.likelihood === "medium"
                                ? "border-amber-200 bg-amber-50/50"
                                : "border-gray-200 bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {rec.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                rec.likelihood === "high"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : rec.likelihood === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {rec.likelihood}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-2 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {searching ? "Recherche..." : "Relancer la recherche"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors border border-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
