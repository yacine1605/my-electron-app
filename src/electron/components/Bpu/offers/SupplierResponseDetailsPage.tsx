import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const API_BASE_URL = "https://api.digitservz.dz";

export default function SupplierResponseDetailsPage() {
  const { offerId, responseId } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/offers/${offerId}/responses/${responseId}`,
      );

      const result = await res.json();

      setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-500">Réponse introuvable</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{data.supplierName}</h1>

            <p className="text-gray-500">{data.emailSubject}</p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border px-4 py-2"
          >
            Retour
          </button>
        </div>
      </div>

      {/* ANALYSIS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Score Global</p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {data.globalScore || 0}/100
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Conformité</p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {data.conformityRate || 0}%
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total</p>

          <p className="mt-2 text-3xl font-bold">{data.totalAmount || 0} DZD</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Livraison</p>

          <p className="mt-2 text-3xl font-bold">{data.deliveryDelay || "-"}</p>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Produits analysés</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Produit demandé</th>

                <th className="px-4 py-3 text-left">Produit fournisseur</th>

                <th className="px-4 py-3 text-left">Conformité</th>

                <th className="px-4 py-3 text-left">Prix</th>
              </tr>
            </thead>

            <tbody>
              {data.products?.map((product: any) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-4">{product.requestedProduct}</td>

                  <td className="px-4 py-4">{product.supplierProduct}</td>

                  <td className="px-4 py-4">{product.conformityStatus}</td>

                  <td className="px-4 py-4">{product.unitPrice} DZD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NOTES */}
      {data.notes && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-800">Analyse IA</h3>

          <p className="mt-2 text-sm text-blue-700">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
