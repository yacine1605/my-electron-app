import { useOfferst, useOfferStats } from "@/lib/hooks/Useoffers";
import { AlertTriangle } from "lucide-react";
import OfferNotifications from "./offers/OfferNotifications";

// The /stats endpoint returns raw SQL rows (array) or a plain object.
// This helper normalizes both shapes.

/* ─── Types ─── */

/* ─── React Query hooks ─── */

/* ─── Component ─── */

export default function DashboardTechiniquePage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useOfferStats();

  const { data: offers = [], isLoading: offersLoading } = useOfferst();
  //console.log(stats);

  /* Derived data (client-side, from the offers list) */
  const recent = [...offers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const statusLabel: Record<string, string> = {
    draft: "Brouillon",
    pending: "En attente",
    sent: "Envoyée",
    validated: "Validée",
    rejected: "Rejetée",
    completed: "Terminée",
  };

  const statusClass: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending: "bg-amber-100 text-amber-800",
    validated: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    sent: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  /* KPI config mapped to backend stats */
  const kpiCards = stats
    ? [
        {
          label: "Total offres",
          value: stats.total,
          color: "text-blue-800",
        },
        {
          label: "En attente",
          value: stats.pending,
          color: "text-amber-700",
        },
        {
          label: "Brouillons",
          value: stats.draft,
          color: "text-slate-600",
        },
        {
          label: "Échouées",
          value: stats.failed,
          color: "text-red-700",
        },
      ]
    : [];

  if (statsError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Erreur lors du chargement des statistiques.{" "}
          {statsError instanceof Error ? statsError.message : ""}
        </div>
      </div>
    );
  }
  const isStatsForbidden =
    statsError?.message?.includes("403") ||
    (statsError as any)?.response?.status === 403;

  return (
    <>
      {console.log()}
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue d'ensemble de vos offres
          </p>
        </div>
        <div className="p-6">
          <OfferNotifications />
        </div>
        {/* ── FIX: show 403 warning instead of hard error ── */}
        {isStatsForbidden && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Statistiques non disponibles — accès restreint.
          </div>
        )}
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-center animate-pulse"
                >
                  <div className="h-8 bg-slate-200 rounded w-16 mx-auto mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-20 mx-auto" />
                </div>
              ))
            : kpiCards.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-center"
                >
                  <p className={`text-3xl font-semibold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
        </div>

        {/* Secondary stats */}

        {/* Recent offers table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-700">
              Offres récentes
            </h2>
          </div>

          {offersLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Aucune offre créée pour le moment
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left px-4 py-2 font-medium">Titre</th>
                  <th className="text-left px-4 py-2 font-medium">Entité</th>
                  <th className="text-left px-4 py-2 font-medium">Ville</th>
                  <th className="text-left px-4 py-2 font-medium">
                    Destinataires
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((offer) => (
                  <>
                    {console.log(offer)}
                    <tr
                      key={offer.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-40">
                        {offer.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-35">
                        {offer.medicalEntity.name}
                        <span className="ml-1 text-[10px] text-slate-400">
                          {offer.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {offer.medicalEntity.city}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {offer.offerRecipients?.length}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(offer.createdAt).toLocaleDateString("fr-DZ", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusClass[offer.status]}`}
                        >
                          {statusLabel[offer.status]}
                        </span>
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
