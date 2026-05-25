import { useState } from "react";
import {
  X,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  BrainCircuit,
} from "lucide-react";
import type { MissingItem } from "../hooks/services/api";

interface MissingItemsModalProps {
  offerId: string;
  missingItems: MissingItem[];
  onClose: () => void;
  onRegenerate: () => Promise<void>;
}

export function MissingItemsModal({
  offerId,
  missingItems,
  onClose,
  onRegenerate,
}: MissingItemsModalProps) {
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Articles sans fournisseur
            </h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              {missingItems.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {missingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-medium">
                Tous les articles ont un fournisseur
              </p>
              <p className="text-sm mt-1">
                Aucune recherche supplémentaire nécessaire
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingItems.map((item) => (
                <div
                  key={item.itemNumber}
                  className="border border-gray-200 rounded-lg p-3 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                          Lot {item.itemNumber}
                        </span>
                        <span className="font-medium text-sm text-gray-900">
                          {item.itemName}
                        </span>
                      </div>

                      {item.onlineSuppliers &&
                        item.onlineSuppliers.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Fournisseurs suggérés :
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.onlineSuppliers
                                .slice(0, 5)
                                .map((supplier, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100"
                                  >
                                    {supplier}
                                  </span>
                                ))}
                              {item.onlineSuppliers.length > 5 && (
                                <span className="text-xs text-gray-400">
                                  +{item.onlineSuppliers.length - 5} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      {item.aiRecommendations && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <span className="font-semibold text-indigo-600 flex items-center gap-1 mb-1">
                            <BrainCircuit className="w-3 h-3" /> Recommandation
                            IA :
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-xs">
                            {item.aiRecommendations}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || missingItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Recherche en cours..." : "Relancer la recherche"}
          </button>

          <a
            href={`/api/best-offer/offers/${offerId}/generate`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Générer Excel
          </a>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";
