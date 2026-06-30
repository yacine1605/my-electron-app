import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wand2,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import {
  OfferItem,
  SupplierItemAnalysis,
  UserSelection,
} from "./useOfferComparison";

function CollapsibleItemRow({
  item,
  suppliers,
  isExpanded,
  onToggle,
  onSearchSuppliers,
  searchResult,
  userSelection, // NEW
  onSelectSupplier, // NEW
}: {
  item: OfferItem;
  suppliers: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onSearchSuppliers: () => void;
  searchResult?: any;
  userSelection?: UserSelection | null; // NEW
  onSelectSupplier: (supplierId: string | null) => void; // NEW
}) {
  const supplierItems = useMemo(() => {
    return suppliers.map((s) => {
      const found = s.items.find((i: any) => i.offerItemId === item.id);
      return {
        supplierId: s.supplierId,
        supplierName: s.supplierName,
        data: found as SupplierItemAnalysis | undefined,
      };
    });
  }, [suppliers, item.id]);

  const hasIssues = supplierItems.some((si) => {
    if (!si.data) return true;
    return (
      (si.data.conformityPercentage || 0) < item.minConformityPercentage ||
      !si.data.isTechnicallyCompliant
    );
  });

  const noResponses = supplierItems.every((si) => !si.data);

  // Check if current auto-best differs from user selection
  const autoBestSupplier = useMemo(() => {
    // Find the supplier with best score/lowest price among compliant
    const compliant = supplierItems.filter((si) => {
      if (!si.data) return false;
      return (
        (si.data.conformityPercentage || 0) >= item.minConformityPercentage &&
        si.data.isTechnicallyCompliant
      );
    });
    if (compliant.length > 0) {
      return compliant.sort((a, b) => {
        const priceA = a.data?.unitPriceHT ?? Infinity;
        const priceB = b.data?.unitPriceHT ?? Infinity;
        return priceA - priceB;
      })[0];
    }
    // Fallback: any with data
    const withData = supplierItems.filter((si) => si.data);
    if (withData.length > 0) {
      return withData.sort((a, b) => {
        const confA = a.data?.conformityPercentage ?? 0;
        const confB = b.data?.conformityPercentage ?? 0;
        return confB - confA;
      })[0];
    }
    return null;
  }, [supplierItems, item.minConformityPercentage]);

  const isOverridden =
    userSelection && autoBestSupplier?.supplierId !== userSelection.supplierId;

  return (
    <div
      className={`transition-colors ${isExpanded ? "bg-white" : "hover:bg-gray-50/60"}`}
    >
      {/* ── Header Row ── */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3 group"
      >
        <div className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
              Article {item.itemNumber}
            </span>
            <span className="font-medium text-gray-900 text-sm truncate">
              {item.name}
            </span>
            {item.code && (
              <span className="text-xs text-gray-400 font-mono">
                {item.code}
              </span>
            )}
            {hasIssues && (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            {noResponses && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                AUCUNE RÉPONSE
              </span>
            )}
            {/* Selection indicator */}
            {userSelection && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOverridden
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isOverridden ? "Sélection manuelle" : "Sélection auto"}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Qté demandée : <strong>{item.requestedQuantity}</strong> •
            Conformité min : <strong>{item.minConformityPercentage}%</strong> •{" "}
            <span className="text-gray-400">
              {supplierItems.filter((s) => s.data).length}/{suppliers.length}{" "}
              fournisseurs ont répondu
            </span>
            {userSelection && (
              <span className="ml-2 text-indigo-600 font-medium">
                → Retenu: {userSelection.supplierName}
              </span>
            )}
          </div>
        </div>

        {/* Mini conformity bars */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {supplierItems.map((si) => {
            const isSelected = userSelection?.supplierId === si.supplierId;
            return (
              <div
                key={si.supplierId}
                className={`text-center w-16 p-1 rounded ${
                  isSelected ? "bg-indigo-100 ring-1 ring-indigo-300" : ""
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    !si.data
                      ? "text-gray-300"
                      : (si.data.conformityPercentage || 0) >=
                          item.minConformityPercentage
                        ? "text-emerald-600"
                        : "text-red-500"
                  }`}
                >
                  {si.data
                    ? `${(si.data.conformityPercentage || 0).toFixed(0)}%`
                    : "—"}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full ${
                      !si.data
                        ? "bg-gray-200"
                        : (si.data.conformityPercentage || 0) >=
                            item.minConformityPercentage
                          ? "bg-emerald-400"
                          : "bg-red-400"
                    }`}
                    style={{
                      width: si.data
                        ? `${si.data.conformityPercentage}%`
                        : "0%",
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">
                  {si.supplierName}
                </div>
              </div>
            );
          })}
        </div>

        {/* Average conformity badge */}
        <div className="shrink-0 ml-2 text-right w-20 hidden sm:block">
          {/* ... existing ... */}
        </div>

        {noResponses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearchSuppliers();
            }}
            className="shrink-0 ml-2 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
            title="Rechercher des fournisseurs avec IA"
          >
            <Wand2 className="w-4 h-4" />
          </button>
        )}
      </button>

      {/* ── Expanded Detail View ── */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Selection Controls */}
          <div className="mb-3 flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              Fournisseur retenu pour l'export Excel :
            </span>
            <select
              value={userSelection?.supplierId || ""}
              onChange={(e) => onSelectSupplier(e.target.value || null)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">🤖 Auto (IA — meilleur prix conforme)</option>
              {supplierItems.map((si) => (
                <option key={si.supplierId} value={si.supplierId}>
                  {si.data
                    ? `${si.supplierName} — ${(si.data.conformityPercentage || 0).toFixed(0)}% — ${si.data.unitPriceHT.toLocaleString("fr-FR")} DZD`
                    : `${si.supplierName} — (aucune offre)`}
                </option>
              ))}
            </select>
            {userSelection && (
              <button
                onClick={() => onSelectSupplier(null)}
                className="text-xs text-red-600 hover:text-red-800 font-medium underline"
              >
                Réinitialiser (Auto)
              </button>
            )}
            {isOverridden && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⚠️ Diffère de la sélection automatique
              </span>
            )}
          </div>

          {/* Desktop Table with selection column */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-center font-medium text-gray-600 w-10">
                    Retenir
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 w-48">
                    Fournisseur
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Produit proposé
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Conformité
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Prix U. HT
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    TVA
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Qté
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Total HT
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">
                    Technique
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplierItems.map((si) => {
                  const isSelected =
                    userSelection?.supplierId === si.supplierId;
                  const isAutoBest =
                    autoBestSupplier?.supplierId === si.supplierId;
                  return (
                    <tr
                      key={si.supplierId}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        isSelected
                          ? "bg-indigo-50/60 border-l-4 border-indigo-500"
                          : ""
                      } ${isAutoBest && !isSelected ? "bg-emerald-50/20" : ""}`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="radio"
                          name={`select-${item.id}`}
                          checked={isSelected}
                          onChange={() => onSelectSupplier(si.supplierId)}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                        />
                        {isAutoBest && !isSelected && (
                          <div className="text-[9px] text-emerald-600 font-medium mt-0.5">
                            Auto
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {si.supplierName}
                        {isAutoBest && (
                          <span className="ml-1 text-emerald-600 text-xs">
                            ★
                          </span>
                        )}
                      </td>
                      {/* ... rest of existing cells ... */}
                      <td className="px-3 py-3">
                        {si.data ? (
                          <div>
                            <div className="text-gray-900">
                              {si.data.proposedName}
                            </div>
                            {si.data.proposedBrand && (
                              <div className="text-xs text-gray-500">
                                Marque : {si.data.proposedBrand}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            Aucune proposition
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {si.data ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                (si.data.conformityPercentage || 0) >=
                                item.minConformityPercentage
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {(si.data.conformityPercentage || 0).toFixed(0)}%
                            </span>
                            <div className="w-16 bg-gray-100 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  (si.data.conformityPercentage || 0) >=
                                  item.minConformityPercentage
                                    ? "bg-emerald-400"
                                    : "bg-red-400"
                                }`}
                                style={{
                                  width: `${si.data.conformityPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-gray-700">
                        {si.data
                          ? `${si.data.unitPriceHT.toLocaleString("fr-FR")} DZD`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {si.data ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-sm text-gray-700">
                              {si.data.tvaPercentage.toFixed(0)}%
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {(
                                (si.data.unitPriceHT * si.data.tvaPercentage) /
                                100
                              ).toLocaleString("fr-FR")}{" "}
                              DZD
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">
                        {si.data ? (si.data.quantityOffered ?? "—") : "—"}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-gray-900">
                        {si.data
                          ? `${si.data.totalHT.toLocaleString("fr-FR")} DZD`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {si.data ? (
                          si.data.isTechnicallyCompliant ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Non conforme
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards with selection */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {supplierItems.map((si) => {
              const isSelected = userSelection?.supplierId === si.supplierId;
              const isAutoBest = autoBestSupplier?.supplierId === si.supplierId;
              return (
                <div
                  key={si.supplierId}
                  onClick={() => si.data && onSelectSupplier(si.supplierId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : isAutoBest
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-gray-200 hover:border-gray-300"
                  } ${!si.data ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => onSelectSupplier(si.supplierId)}
                        className="w-4 h-4 text-indigo-600"
                        disabled={!si.data}
                      />
                      <span className="font-medium text-sm text-gray-900">
                        {si.supplierName}
                      </span>
                      {isAutoBest && (
                        <span className="text-xs text-emerald-600 font-bold">
                          ★ Auto
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        (si.data?.conformityPercentage || 0) >=
                        item.minConformityPercentage
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {(si.data?.conformityPercentage || 0).toFixed(0)}%
                    </span>
                  </div>
                  {/* ... rest of existing card content ... */}
                  {si.data && (
                    <>
                      <div className="text-sm text-gray-800 mb-1">
                        {si.data.proposedName}
                      </div>
                      {si.data.proposedBrand && (
                        <div className="text-xs text-gray-500 mb-2">
                          Marque : {si.data.proposedBrand}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <div className="text-gray-400">Prix U. HT</div>
                          <div className="font-mono font-medium">
                            {si.data.unitPriceHT.toLocaleString("fr-FR")} DZD
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">
                            TVA ({si.data.tvaPercentage.toFixed(0)}%)
                          </div>
                          <div className="font-mono font-medium">
                            {(
                              (si.data.unitPriceHT * si.data.tvaPercentage) /
                              100
                            ).toLocaleString("fr-FR")}{" "}
                            DZD
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Total HT</div>
                          <div className="font-mono font-medium">
                            {si.data.totalHT.toLocaleString("fr-FR")} DZD
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Qté offerte</div>
                          <div>{si.data.quantityOffered ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Technique</div>
                          <div
                            className={
                              si.data.isTechnicallyCompliant
                                ? "text-emerald-600"
                                : "text-red-500"
                            }
                          >
                            {si.data.isTechnicallyCompliant
                              ? "Conforme"
                              : "Non conforme"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {isSelected && (
                    <div className="mt-2 text-xs font-medium text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sélectionné pour
                      l'export Excel
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ... existing AI Search Results and Technical Details ... */}
        </div>
      )}
    </div>
  );
}
