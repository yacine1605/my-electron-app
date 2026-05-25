import { Link, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query"; // ← ADD THIS

import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FolderOpen,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffer } from "@/lib/hooks/Useoffers";
import { useState } from "react";
import { updateOfferStatus } from "./hooks/services/api";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  completed: {
    label: "Terminée",
    color: "text-emerald-700 bg-emerald-100 border-emerald-200",
    icon: CheckCircle2,
  },
  sent: {
    label: "Envoyée",
    color: "text-blue-700 bg-blue-100 border-blue-200",
    icon: Clock,
  },
  pending: {
    label: "En attente",
    color: "text-amber-700 bg-amber-100 border-amber-200",
    icon: Clock,
  },
  draft: {
    label: "Brouillon",
    color: "text-gray-700 bg-gray-100 border-gray-200",
    icon: FolderOpen,
  },
  failed: {
    label: "Échouée",
    color: "text-red-700 bg-red-100 border-red-200",
    icon: XCircle,
  },
  partial_failed: {
    label: "Partiel",
    color: "text-orange-700 bg-orange-100 border-orange-200",
    icon: AlertTriangle,
  },
};

const allStatuses = [
  { value: "draft", label: "Brouillon" },
  { value: "pending", label: "En attente" },
  { value: "sent", label: "Envoyée" },
  { value: "partial_failed", label: "Partiellement échouée" },
  { value: "failed", label: "Échouée" },
  { value: "completed", label: "Terminée" },
];

export default function OfferDetailsPage() {
  const { offerId } = useParams();
  const { data: offer, isLoading, isError, refetch } = useOffer(offerId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const queryClient = useQueryClient(); // ← ADD THIS

  if (isLoading) {
    return (
      <div className="space-y-4 bg-white p-6">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-red-600">
        Impossible de charger l'offre.
      </div>
    );
  }

  const attachmentUrl = offer.attachmentUrl
    ? `https://api.digitservz.dz${offer.attachmentUrl}`
    : null;

  const currentStatus = offer.status || "draft";
  const st = statusConfig[currentStatus] || statusConfig.draft;
  const StatusIcon = st.icon;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setShowStatusMenu(false);
      return;
    }
    setIsUpdating(true);
    setShowStatusMenu(false);
    try {
      await updateOfferStatus(offerId!, newStatus as any);
      await queryClient.invalidateQueries({ queryKey: ["offers"] }); // sidebar list
      await queryClient.invalidateQueries({ queryKey: ["offer", offerId] }); //
      await refetch();
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="min-h-full bg-white p-6">
        <div className="mb-6 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Offre</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {offer.title || "(Sans titre)"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Créée le {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Status Editor */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isUpdating}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${st.color} ${isUpdating ? "opacity-70 cursor-wait" : "hover:brightness-95 cursor-pointer"}`}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <StatusIcon className="w-4 h-4" />
              )}
              {isUpdating ? "Mise à jour..." : st.label}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Changer le statut
                </div>
                {allStatuses.map((s) => {
                  const cfg = statusConfig[s.value];
                  const Icon = cfg.icon;
                  const isActive = s.value === currentStatus;
                  return (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left ${
                        isActive
                          ? "bg-slate-50 font-semibold text-slate-900"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color.split(" ")[0]}`} />
                      {s.label}
                      {isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Entité médicale
            </h2>

            <div className="space-y-2 text-sm">
              <Info label="Nom" value={offer.medicalEntity.name} />
              <Info label="Type" value={offer.medicalEntity.type} />
              <Info label="Spécialité" value={offer.medicalEntity.speciality} />
              <Info label="Ville" value={offer.medicalEntity.city} />
              <Info label="Adresse" value={offer.medicalEntity.address} />
              <Info label="Téléphone" value={offer.medicalEntity.phone} />
              <Info label="Email" value={offer.medicalEntity.email} />
              <Info label="Contact" value={offer.medicalEntity.contactPerson} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Pièce jointe
            </h2>

            {offer.attachmentName && attachmentUrl ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-emerald-900">
                      {offer.attachmentName}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {(offer.attachmentSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <a href={attachmentUrl} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le PDF
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Aucune pièce jointe disponible.
              </p>
            )}
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Destinataires internes
          </h2>

          {offer.offerRecipients.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun destinataire.</p>
          ) : (
            <div className="space-y-2">
              {offer.offerRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {recipient.recipient.firstName}
                      {recipient.recipient.lastName}
                    </p>
                    <p className="text-slate-500">
                      {recipient.recipient.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                    {recipient.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-medium text-slate-700">
        {label} :
      </span>
      <span className="text-slate-600">{value || "—"}</span>
    </div>
  );
}
