import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { Search, Plus, Building2, Users, Clock, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferStatus, OfferSummary, useOffers } from "@/lib/hooks/Useoffers";

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OfferStatus, { label: string; className: string }> =
  {
    draft: {
      label: "Brouillon",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
    pending: {
      label: "En attente",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    sent: {
      label: "Envoyée",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    partial_failed: {
      label: "Partiel",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
    failed: {
      label: "Échouée",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    completed: {
      label: "Terminée",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };

function StatusBadge({ status }: { status: OfferStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer Card
// ─────────────────────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  isActive,
  isAdmin,
}: {
  offer: OfferSummary;
  isActive: boolean;
  isAdmin: boolean;
}) {
  // Admin routes are under /admin/offers, agent routes under /offer/liste
  const detailPath = isAdmin
    ? `/admin/offers/${offer.id}`
    : `/offer/liste/${offer.id}`;

  const editPath = isAdmin
    ? `/admin/offers/${offer.id}/edit`
    : `/offer/liste/${offer.id}/edit`;

  return (
    <div
      className={`group relative rounded-lg border p-3 transition-colors hover:bg-accent/40 ${
        isActive ? "border-primary/30 bg-accent/60" : "bg-background"
      }`}
    >
      {/* Card content is clickable to view details */}
      <Link to={detailPath} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">
              {offer.title || "(Sans titre)"}
            </div>
          </div>
          <StatusBadge status={offer.status} />
        </div>

        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{offer.medicalEntity.name}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {offer.offerRecipients.length} destinataire
            {offer.offerRecipients.length !== 1 ? "s" : ""}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(offer.createdAt)}
          </span>
        </div>
      </Link>

      {/* Edit button — visible on hover, always for admin */}
      <div className="mt-2 flex justify-end border-t border-dashed pt-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Link to={editPath}>
            <Pencil className="h-3 w-3" />
            Modifier
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function OfferSkeletons() {
  return (
    <div className="space-y-2 pr-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function OffersPage({
  activeOfferId,
  children,
}: {
  activeOfferId?: string;
  children?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const location = useLocation();

  // Detect if we're inside /admin route
  const isAdmin = location.pathname.startsWith("/admin");

  const { data: offers, isLoading, isError } = useOffers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !offers) return offers ?? [];
    return offers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.medicalEntity.name.toLowerCase().includes(q) ||
        o.emailSubject.toLowerCase().includes(q),
    );
  }, [search, offers]);

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ⬇️ CRITICAL FIX: added flex/grid layout and render children */}
      <div className="flex h-full gap-4 p-4">
        {/* Sidebar */}
        <aside className="flex w-80 min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
          {/* Header */}
          <div className="shrink-0 p-3 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">Offres</div>
              {isAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/offers/new">
                    {" "}
                    {/* adjust if you have a new offer route */}
                    <Plus className="mr-1 h-3 w-3" />
                    Nouveau
                  </Link>
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une offre…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Offers List */}
          <ScrollArea className="flex-1 px-3 py-2">
            {isLoading && <OfferSkeletons />}

            {isError && (
              <p className="py-6 text-center text-sm text-destructive">
                Impossible de charger les offres.
              </p>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune offre trouvée.
              </p>
            )}

            {!isLoading && !isError && (
              <div className="space-y-2 pr-2">
                {filtered.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isActive={offer.id === activeOfferId}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {!isLoading && offers && (
            <div className="shrink-0 border-t px-4 py-2">
              <p className="text-[11px] text-muted-foreground">
                {filtered.length} / {offers.length} offre
                {offers.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </aside>

        {/* ⬇️ CRITICAL FIX: actually render children (Outlet content) */}
        <main className="flex-1 min-w-0 overflow-hidden rounded-xl border bg-card">
          {children ?? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isAdmin
                ? "Sélectionnez une offre pour voir les détails."
                : "Sélectionnez une offre pour voir les détails."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
