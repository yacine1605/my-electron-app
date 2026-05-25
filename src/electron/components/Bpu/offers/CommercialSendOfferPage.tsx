import { useParams } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";

import CommercialSupplierEmailWizard from "./EMailCommertion";
import { useOffer } from "@/lib/hooks/Useoffers";

export default function CommercialSendOfferPage() {
  const { offerId } = useParams();
  const { data: offer, isLoading, isError } = useOffer(offerId);

  if (isLoading) {
    return (
      <div className="space-y-4 bg-white p-6">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-red-600">
        Impossible de préparer l’envoi.
      </div>
    );
  }

  return <CommercialSupplierEmailWizard offerId={offer.id} />;
}
