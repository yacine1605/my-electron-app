import { Link, useParams } from "react-router";
import {
  FileText,
  Mail,
  GitCompare,
  Download,
  Layers,
  ClipboardCheck,
  ShieldCheck,
  Calendar,
  Building2,
  MapPin,
  FileBadge,
  Clock,
  Wrench,
  GraduationCap,
  MapPinned,
  Stethoscope,
  Briefcase,
  Hash,
  FileSearch,
  CheckCircle2,
  XCircle,
  Gavel,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffer } from "@/lib/hooks/Useoffers";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatProcedureType(type: string | null | undefined): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    appel_offre: "Appel d'offres",
    consultation: "Consultation",
  };
  return map[type] || type;
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="w-36 shrink-0 font-medium text-slate-700">
        {label} :
      </span>
      <span className="text-slate-600">{value || "—"}</span>
    </div>
  );
}

function BadgeYesNo({ value }: { value?: boolean }) {
  if (value === undefined || value === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        <XCircle className="h-3 w-3" />
        Non
      </span>
    );
  }
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Oui
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
      <XCircle className="h-3 w-3" />
      Non
    </span>
  );
}

function DocBadge({ label, present }: { label: string; present?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
        present
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      <span className="font-medium">{label}</span>
      <BadgeYesNo value={present} />
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function OfferDetailsPage() {
  const { offerId } = useParams();
  const { data: offer, isLoading, isError } = useOffer(offerId);

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

  return (
    <>
      <div className="min-h-full bg-white p-6">
        {/* ── Header ─────────────────────────────────────────────── */}
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

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/offer/liste/${offer.id}/send`}>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer aux fournisseurs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/offer/liste/${offer.id}/responses`}>
                <Mail className="mr-2 h-4 w-4" />
                Les Réponses des fournisseurs
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/offer/liste/${offer.id}/compare`}>
                <GitCompare className="mr-2 h-4 w-4" />
                Comparer proformas
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Row 1: Entité médicale + Pièce jointe ────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Entité médicale */}
          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">
                Entité médicale
              </h2>
            </div>
            <div className="space-y-2 text-sm">
              <Info label="Nom" value={offer.medicalEntity?.name} />
              <Info label="Type" value={offer.medicalEntity?.type} />
              <Info label="Ville" value={offer.medicalEntity?.city} />
              <Info label="Adresse" value={offer.medicalEntity?.address} />
              <Info label="Téléphone" value={offer.medicalEntity?.phone} />
              <Info label="Email" value={offer.medicalEntity?.email} />
              <Info
                label="Contact"
                value={offer.medicalEntity?.contactPerson}
              />
            </div>
          </section>

          {/* Pièce jointe */}
          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">
                Pièce jointe
              </h2>
            </div>
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

        {/* ── Row 2: En-tête de l'offre ────────────────────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              En-tête de l'offre
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <Info label="Nom commercial" value={offer.commercialName} />
            <Info
              label="N° consultation / AO"
              value={offer.consultationNumber}
            />
            <Info label="Établissement" value={offer.establishment} />
            <Info label="Wilaya" value={offer.wilaya} />
            <Info label="Lieu de dépôt" value={offer.depositLocation} />
            <Info
              label="Type de procédure"
              value={formatProcedureType(offer.procedureType)}
            />
            <Info
              label="Date dépôt hôpital"
              value={formatDate(offer.hospitalDepositDate)}
            />
            <Info
              label="Date dépôt service technique"
              value={formatDate(offer.technicalDepartmentDepositDate)}
            />
          </div>
        </section>

        {/* ── Row 3: Lots ──────────────────────────────────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Liste des lots
            </h2>
          </div>
          {offer.lots?.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun lot associé à cette offre.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offer.lots.map((lot: any) => (
                <div
                  key={lot.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm transition-colors hover:border-slate-200 hover:bg-slate-100"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Lot n° {lot.lotNumber}
                  </span>
                  <p className="font-medium text-slate-900">{lot.lotObject}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Row 4: Documents requis (has_*) ──────────────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Documents requis
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocBadge
              label="Fiches techniques"
              present={offer.hasTechnicalSheet}
            />
            <DocBadge
              label="Certificats conformité"
              present={offer.hasConformityCertificate}
            />
            <DocBadge
              label="Certificat d'origine"
              present={offer.hasOriginCertificate}
            />
            <DocBadge
              label="Certificat de fabrication DZ"
              present={offer.hasManufacturingCertificate}
            />
            <DocBadge
              label="Manuel d'utilisateur"
              present={offer.hasUserManual}
            />
            <DocBadge label="Catalogues" present={offer.hasCatalog} />
            <DocBadge label="Échantillons" present={offer.hasSample} />
          </div>
        </section>

        {/* ── Row 5: Prescriptions (Durées & délais) ───────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Prescriptions (Durées & délais)
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <Info label="Durée de garantie" value={offer.warrantyDuration} />
            <Info
              label="Délai de livraison / installation"
              value={offer.deliveryDelay}
            />
            <Info label="Durée de S.A.V" value={offer.savDuration} />
            <Info
              label="Délai d'intervention"
              value={offer.interventionDelay}
            />
            <Info label="Durée de formation" value={offer.trainingDuration} />
            <Info label="Localités S.A.V" value={offer.savLocations} />
          </div>
        </section>

        {/* ── Row 6: Audit commercial ────────────────────────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Audit commercial
            </h2>
          </div>
          {offer.supplierCommercialAudit ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {offer.supplierCommercialAudit}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Aucun audit commercial renseigné.
            </p>
          )}
        </section>

        {/* ── Row 7: Destinataires internes ────────────────────── */}
        <section className="mt-5 rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Destinataires internes
            </h2>
          </div>
          {offer.offerRecipients?.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun destinataire.</p>
          ) : (
            <div className="space-y-2">
              {offer.offerRecipients.map((recipient: any) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {recipient.recipient?.firstName || ""}{" "}
                      {recipient.recipient?.lastName || ""}
                    </p>
                    <p className="text-slate-500">
                      {recipient.recipient?.email}
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
