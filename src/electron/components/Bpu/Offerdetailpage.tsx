import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Paperclip,
  Clock,
  Send,
  FileText,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { Link, useParams } from "react-router"; // swap for next/link + useParams if Next.js

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OfferStatus, useOffer } from "@/lib/hooks/Useoffers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OfferStatus, { label: string; className: string }> =
  {
    draft: {
      label: "Brouillon",
      className: "bg-gray-100 text-gray-700 border-gray-200",
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
  };

function StatusBadge({ status }: { status: OfferStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string | null | undefined, includeTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm text-foreground wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-6 w-20 ml-auto" />
      </div>
      <Separator />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: offer, isLoading, isError } = useOffer(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !offer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Offre introuvable.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/offer/liste/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {console.log(offer)}
      <ScrollArea className="h-full bg-white">
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          {/* ── Header ── */}
          <div className="flex items-start gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 mt-0.5"
            >
              <Link to="offer/liste/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {offer.title || "(Sans titre)"}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground truncate">
                {offer.emailSubject}
              </p>
            </div>
            <StatusBadge status={offer.status} />
          </div>

          <Separator />

          {/* ── Medical entity ── */}
          <Section title="Entité médicale">
            <InfoRow
              icon={Building2}
              label="Nom"
              value={offer.medicalEntity.name}
            />
            <InfoRow
              icon={Tag}
              label="Type / Spécialité"
              value={`${offer.medicalEntity.type} · ${offer.medicalEntity.speciality}`}
            />
            <InfoRow
              icon={MapPin}
              label="Ville"
              value={`${offer.medicalEntity.city}${offer.medicalEntity.address ? ` — ${offer.medicalEntity.address}` : ""}`}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={
                <a
                  href={`mailto:${offer.medicalEntity.email}`}
                  className="text-primary hover:underline"
                >
                  {offer.medicalEntity.email}
                </a>
              }
            />
            {offer.medicalEntity.phone && (
              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={offer.medicalEntity.phone}
              />
            )}
            <InfoRow
              icon={User}
              label="Contact"
              value={offer.medicalEntity.contactPerson}
            />
          </Section>

          <Separator />

          {/* ── Email content ── */}
          <Section title="Contenu de l'email">
            <InfoRow icon={Mail} label="Sujet" value={offer.emailSubject} />

            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Corps
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {offer.emailBody}
              </div>
            </div>

            {offer.emailSignature && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                  Signature
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap text-muted-foreground italic">
                  {offer.emailSignature}
                </div>
              </div>
            )}
          </Section>

          {/* ── Attachment ── */}
          {offer.attachmentName && (
            <>
              <Separator />
              <Section title="Pièce jointe">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background border">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {offer.attachmentName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {offer.attachmentMimeType}
                      {offer.attachmentSize
                        ? ` · ${formatBytes(offer.attachmentSize)}`
                        : ""}
                    </div>
                  </div>
                  {offer.attachmentUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <a
                        href={offer.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Télécharger
                      </a>
                    </Button>
                  )}
                </div>
              </Section>
            </>
          )}

          <Separator />

          {/* ── Recipients ── */}
          <Section title={`Destinataires (${offer.offerRecipients.length})`}>
            {offer.offerRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun destinataire.
              </p>
            ) : (
              <div className="space-y-2">
                {offer.offerRecipients.map(({ id, recipient }) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/40 p-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {recipient.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {recipient.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {recipient.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Separator />

          {/* ── Timestamps ── */}
          <Section title="Dates">
            <InfoRow
              icon={Clock}
              label="Créée le"
              value={formatDate(offer.createdAt, true)}
            />
            {offer.sentAt && (
              <InfoRow
                icon={Send}
                label="Envoyée le"
                value={formatDate(offer.sentAt, true)}
              />
            )}
            {offer.updatedAt && (
              <InfoRow
                icon={FileText}
                label="Modifiée le"
                value={formatDate(offer.updatedAt, true)}
              />
            )}
          </Section>

          <div className="pb-4" />
        </div>
      </ScrollArea>
    </>
  );
}
