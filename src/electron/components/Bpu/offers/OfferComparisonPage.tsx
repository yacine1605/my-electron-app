import { useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldCheck,
  Search,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Wand2,
  Loader2,
} from "lucide-react";
import { useOfferComparison } from "./hooks/useOfferComparison";
import { MissingItemsModal } from "./components/MissingItemsModal";
import { SupplierSearchModal } from "./components/SupplierSearchModal";
import type { OfferItem, SupplierItemAnalysis } from "./hooks/services/api";

export default function OfferComparisonPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    analyzing,
    analysisProgress,
    exporting,
    missingItems,
    searchResults,
    loadComparison,
    startAnalysis,
    handleExport,
    searchSuppliersForItem,
    refreshMissingItems,
    regenerateMissing,
  } = useOfferComparison(offerId);

  // ─── Local UI State ───
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyNonCompliant, setOnlyNonCompliant] = useState(false);

  // ─── Modals ───
  const [missingItemsOpen, setMissingItemsOpen] = useState(false);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [selectedItemForSearch, setSelectedItemForSearch] =
    useState<OfferItem | null>(null);

  // Expand/collapse all
  const handleExpandAll = useCallback(() => {
    if (!data) return;
    const newExpand = !expandAll;
    setExpandAll(newExpand);
    setExpandedItems(
      newExpand ? new Set(data.requestedItems.map((i) => i.id)) : new Set(),
    );
  }, [expandAll, data]);

  const toggleItem = useCallback(
    (itemId: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
          setExpandAll(false);
        } else {
          next.add(itemId);
          if (data && next.size === data.requestedItems.length) {
            setExpandAll(true);
          }
        }
        return next;
      });
    },
    [data],
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.requestedItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `lot ${item.itemNumber}`.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (onlyNonCompliant) {
        const hasIssue = data.suppliers.some((s) => {
          const analysis = s.items.find((i) => i.offerItemId === item.id);
          if (!analysis) return true;
          return (
            (analysis.conformityPercentage || 0) < item.minConformityPercentage
          );
        });
        return hasIssue;
      }
      return true;
    });
  }, [data, searchQuery, onlyNonCompliant]);

  const handleOpenSupplierSearch = useCallback(
    (item: OfferItem) => {
      setSelectedItemForSearch(item);
      setSupplierSearchOpen(true);
      // Pre-search if not already cached
      if (!searchResults.has(item.name)) {
        searchSuppliersForItem(item.name);
      }
    },
    [searchResults, searchSuppliersForItem],
  );

  const handleOpenMissingItems = useCallback(async () => {
    await refreshMissingItems();
    setMissingItemsOpen(true);
  }, [refreshMissingItems]);

  if (loading) return <ComparisonSkeleton />;
  if (error && !data)
    return <ErrorState message={error} onRetry={loadComparison} />;
  if (!data?.success && !data)
    return (
      <ErrorState message="Aucune donnée disponible" onRetry={loadComparison} />
    );

  const hasMissingItems =
    missingItems.length > 0 ||
    data.suppliers.some((s) => s.items.some((i) => !i.proposedName));

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ─── Header ─── */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/offer/liste/${offerId}`)}
              className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {data.offerTitle}
              </h1>
              <p className="text-sm text-gray-500">
                {data.medicalEntity} • {data.requestedItems.length} articles •{" "}
                {data.suppliers.length} fournisseurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => startAnalysis(false)}
              disabled={analyzing}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`}
              />
              {analyzing ? `Analyse ${analysisProgress}%` : "Relancer IA"}
            </button>

            <button
              onClick={handleOpenMissingItems}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                hasMissingItems
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              Articles manquants
              {hasMissingItems && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-900 text-xs rounded-full font-bold">
                  !
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {exporting ? "Excel..." : "Exporter Excel"}
            </button>
          </div>
        </header>

        {/* ─── Analysis Progress Bar ─── */}
        {analyzing && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-indigo-800 mb-2">
              <span className="font-medium">Analyse en cours...</span>
              <span>{analysisProgress}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Error Banner ─── */}
        {error && !analyzing && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-800">{error}</span>
            <button
              onClick={() => loadComparison()}
              className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ─── Best Supplier Banner ─── */}
        {data.bestSupplier && (
          <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Trophy className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900">
                  Meilleure offre : {data.bestSupplier.supplierName}
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
                  Rang #{data.bestSupplier.rank}
                </span>
              </div>
              <p className="text-sm text-amber-700 mt-0.5">
                Score : {data.bestSupplier.globalScore.toFixed(1)}/100 • Total
                HT : {data.bestSupplier.totalHT.toLocaleString("fr-FR")} DZD
              </p>
            </div>
          </div>
        )}

        {/* ─── Supplier Score Cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {data.suppliers.map((supplier) => (
            <SupplierScoreCard key={supplier.supplierId} supplier={supplier} />
          ))}
        </div>

        {/* ─── Toolbar ─── */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article, code, lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyNonCompliant}
                onChange={(e) => setOnlyNonCompliant(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Non conformes
            </label>

            <button
              onClick={handleExpandAll}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              {expandAll ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              {expandAll ? "Tout réduire" : "Tout déplier"}
            </button>
          </div>
        </div>

        {/* ─── Comparison Matrix ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Matrice de comparaison
            </h2>
            <span className="text-xs text-gray-500">
              {expandedItems.size} / {filteredItems.length} articles dépliés
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucun article ne correspond aux filtres.
              </div>
            ) : (
              filteredItems.map((item) => (
                <CollapsibleItemRow
                  key={item.id}
                  item={item}
                  suppliers={data.suppliers}
                  isExpanded={expandedItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                  onSearchSuppliers={() => handleOpenSupplierSearch(item)}
                  searchResult={searchResults.get(item.name)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {missingItemsOpen && (
        <MissingItemsModal
          offerId={offerId!}
          missingItems={missingItems}
          onClose={() => setMissingItemsOpen(false)}
          onRegenerate={regenerateMissing}
        />
      )}

      {supplierSearchOpen && selectedItemForSearch && (
        <SupplierSearchModal
          item={selectedItemForSearch}
          searchResult={searchResults.get(selectedItemForSearch.name)}
          onClose={() => setSupplierSearchOpen(false)}
          onSearch={() => searchSuppliersForItem(selectedItemForSearch.name)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   COLLAPSIBLE ROW
   ═══════════════════════════════════════ */

function CollapsibleItemRow({
  item,
  suppliers,
  isExpanded,
  onToggle,
  onSearchSuppliers,
  searchResult,
}: {
  item: OfferItem;
  suppliers: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onSearchSuppliers: () => void;
  searchResult?: any;
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

  const avgConformity = useMemo(() => {
    const valid = supplierItems.filter((si) => si.data);
    if (valid.length === 0) return 0;
    return (
      valid.reduce((sum, si) => sum + (si.data?.conformityPercentage || 0), 0) /
      valid.length
    );
  }, [supplierItems]);

  return (
    <div
      className={`transition-colors ${isExpanded ? "bg-white" : "hover:bg-gray-50/60"}`}
    >
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
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Qté demandée : <strong>{item.requestedQuantity}</strong> •
            Conformité min : <strong>{item.minConformityPercentage}%</strong> •{" "}
            <span className="text-gray-400">
              {supplierItems.filter((s) => s.data).length}/{suppliers.length}{" "}
              fournisseurs ont répondu
            </span>
          </div>
        </div>

        {/* Mini conformity bars for desktop */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {supplierItems.map((si) => (
            <div key={si.supplierId} className="text-center w-16">
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
                    width: si.data ? `${si.data.conformityPercentage}%` : "0%",
                  }}
                />
              </div>
              <div className="text-[10px] text-gray-400 truncate mt-0.5">
                {si.supplierName}
              </div>
            </div>
          ))}
        </div>

        {/* Average conformity badge */}
        <div className="shrink-0 ml-2 text-right w-20 hidden sm:block">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              avgConformity >= item.minConformityPercentage
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {avgConformity.toFixed(0)}%
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">moyenne</div>
        </div>

        {/* AI Search Button (visible when no responses) */}
        {noResponses && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearchSuppliers();
            }}
            className="shrink-0 ml-2 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            title="Rechercher des fournisseurs avec IA"
          >
            <Wand2 className="w-4 h-4" />
          </button>
        )}
      </button>

      {/* Expanded Detail View */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
                {supplierItems.map((si) => (
                  <tr key={si.supplierId} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {si.supplierName}
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {supplierItems.map((si) => (
              <SupplierItemCard
                key={si.supplierId}
                si={si}
                minConformity={item.minConformityPercentage}
              />
            ))}
          </div>

          {/* AI Search Results (if available) */}
          {searchResult && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                <Wand2 className="w-4 h-4" />
                Résultats de recherche IA
              </h4>
              <div className="flex flex-wrap gap-2">
                {searchResult.suppliers?.map(
                  (supplier: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white text-indigo-700 text-xs rounded border border-indigo-200"
                    >
                      {supplier}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Technical Details */}
          {supplierItems.some((si) => si.data?.analysisDetails?.length > 0) && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Détails techniques par fournisseur
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {supplierItems.map((si) => {
                  if (!si.data?.analysisDetails?.length) return null;
                  return (
                    <div
                      key={si.supplierId}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="font-medium text-sm text-gray-800 mb-2 flex items-center gap-2">
                        {si.supplierName}
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            (si.data.conformityPercentage || 0) >=
                            item.minConformityPercentage
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {(si.data.conformityPercentage || 0).toFixed(0)}%
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {si.data.analysisDetails.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-600 truncate max-w-50">
                              {detail.requirementLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {detail.matched ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span
                                className={`font-medium w-6 text-right ${
                                  detail.matched
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                {detail.score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {si.data.aiSummary && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 italic">
                          <span className="font-semibold text-indigo-600 not-italic flex items-center gap-1 mb-1">
                            <BrainCircuit className="w-3 h-3" /> Analyse IA :
                          </span>
                          {si.data.aiSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   SUPPORTING COMPONENTS
   ═══════════════════════════════════════ */

function SupplierItemCard({
  si,
  minConformity,
}: {
  si: { supplierName: string; data?: SupplierItemAnalysis };
  minConformity: number;
}) {
  if (!si.data) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 opacity-60">
        <div className="font-medium text-sm text-gray-700">
          {si.supplierName}
        </div>
        <div className="text-xs text-gray-400 mt-1">Aucune proposition</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border p-3 ${
        (si.data.conformityPercentage || 0) >= minConformity
          ? "border-gray-200"
          : "border-red-200 bg-red-50/30"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900">
          {si.supplierName}
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            (si.data.conformityPercentage || 0) >= minConformity
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {(si.data.conformityPercentage || 0).toFixed(0)}%
        </span>
      </div>
      <div className="text-sm text-gray-800 mb-1">{si.data.proposedName}</div>
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
            {si.data.isTechnicallyCompliant ? "Conforme" : "Non conforme"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierScoreCard({ supplier }: { supplier: any }) {
  const scoreColor = supplier.isEligible
    ? supplier.globalScore >= 80
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : supplier.globalScore >= 60
        ? "text-blue-600 bg-blue-50 border-blue-200"
        : "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 ${scoreColor}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-xs truncate">
          {supplier.supplierName}
        </span>
        {supplier.isBestSupplier && (
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold">
          {supplier.globalScore.toFixed(0)}
        </span>
        <span className="text-xs opacity-75">/100</span>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px] opacity-90">
        <div>
          <div className="font-semibold">
            {supplier.technicalScore.toFixed(0)}
          </div>
          <div>Tech</div>
        </div>
        <div>
          <div className="font-semibold">{supplier.priceScore.toFixed(0)}</div>
          <div>Prix</div>
        </div>
        <div>
          <div className="font-semibold">
            {supplier.conditionsScore.toFixed(0)}
          </div>
          <div>Cond</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-semibold text-gray-900">
          Erreur de chargement
        </h2>
        <p className="text-sm text-gray-500">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
