import { Link, useParams } from "react-router";
import { FileText, Mail, GitCompare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffer } from "@/lib/hooks/Useoffers";

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
        Impossible de charger l’offre.
      </div>
    );
  }

  const attachmentUrl = offer.attachmentUrl
    ? `https://api.digitservz.dz${offer.attachmentUrl}`
    : null;

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
                Les Reponses des fourniseurs
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
