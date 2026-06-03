import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  Building2,
  FolderOpen,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllOfferExports,
  getExportDownloadUrl,
} from "./hooks/services/api";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  completed: {
    label: "Terminée",
    color: "text-emerald-700 bg-emerald-100",
    icon: CheckCircle2,
  },
  sent: { label: "Envoyée", color: "text-blue-700 bg-blue-100", icon: Clock },
  pending: {
    label: "En attente",
    color: "text-amber-700 bg-amber-100",
    icon: Clock,
  },
  draft: {
    label: "Brouillon",
    color: "text-gray-700 bg-gray-100",
    icon: FolderOpen,
  },
  failed: { label: "Échouée", color: "text-red-700 bg-red-100", icon: XCircle },
  partial_failed: {
    label: "Partiel",
    color: "text-orange-700 bg-orange-100",
    icon: AlertTriangle,
  },
};

export default function OfferExportsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const {
    data: exports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["offer-exports"],
    queryFn: fetchAllOfferExports,
  });

  const filtered = useMemo(() => {
    if (!exports) return [];
    const q = search.toLowerCase();
    return exports.filter(
      (ex) =>
        ex.fileName.toLowerCase().includes(q) ||
        ex.offerTitle?.toLowerCase().includes(q) ||
        ex.medicalEntityName?.toLowerCase().includes(q),
    );
  }, [exports, search]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = [
      { label: "Aujourd'hui", items: [] },
      { label: "Hier", items: [] },
      { label: "Cette semaine", items: [] },
      { label: "Plus ancien", items: [] },
    ];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    filtered.forEach((item) => {
      const d = new Date(item.createdAt);
      if (d >= today) groups[0].items.push(item);
      else if (d >= yesterday) groups[1].items.push(item);
      else if (d >= weekAgo) groups[2].items.push(item);
      else groups[3].items.push(item);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("../dashboard")}
              className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Fichiers Excel générés
              </h1>
              <p className="text-sm text-gray-500">
                Tous les exports de classement et comparatifs
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {exports?.length ?? 0} fichier(s)
          </span>
        </header>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par offre, entité médicale ou nom de fichier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Effacer
            </button>
          )}
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-800">
              {error instanceof Error ? error.message : "Erreur"}
            </span>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {search ? "Aucun résultat." : "Aucun export généré."}
            </p>
          </div>
        )}

        {/* Grouped List */}
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                {group.label}
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {group.items.map((item) => {
                  const st =
                    statusConfig[item.offerStatus || "draft"] ||
                    statusConfig.draft;
                  const StatusIcon = st.icon;

                  // ← SUPPRIME le console.log ici

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="shrink-0 p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {item.fileName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${st.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {item.medicalEntityName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {item.medicalEntityName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`../offer/liste/${item.offerId}`)
                          }
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Voir l'offre
                        </button>
                        <a
                          href={getExportDownloadUrl(
                            `/api/excel/download/${item.offerId}/${item.fileName}`,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Télécharger
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
