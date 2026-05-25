import { useParams } from "react-router";
import OfferResponsesPage from "./SupplierProforma";

export default function OfferResponsesWrapper() {
  const { offerId } = useParams();

  return <OfferResponsesPage offerId={offerId} />;
}
