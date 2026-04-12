import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface MatchItem {
  lotProduct: string;
  quantity: number;
  bestMatch?: {
    name: string;
    supplier: string;
    price: number;
    score: number; // 0 → 1
  };
}
// Types

// Fake data (replace with API later)
const OffresPages = () => {
  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  // Exemple de données - remplacez par vos vraies données
  const initialData: MatchItem[] = [
    {
      lotProduct: "Seringue 5ml",
      quantity: 100,
      bestMatch: {
        name: "Seringue jetable 5 ml",
        supplier: "Supplier A",
        price: 8,
        score: 0.92,
      },
    },
    {
      lotProduct: "Gants latex",
      quantity: 200,
      bestMatch: {
        name: "Gants médicaux latex",
        supplier: "Supplier B",
        price: 5,
        score: 0.76,
      },
    },
    {
      lotProduct: "Thermomètre",
      quantity: 50,
    },
  ];

  const filtered = useMemo(() => {
    return initialData.filter((item) =>
      item.lotProduct.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, initialData]);

  const approveAll = () => {
    const allLotProducts = filtered.map((item) => item.lotProduct);
    setApproved((prev) => [...new Set([...prev, ...allLotProducts])]);
    // Retirer les items approuvés de la liste rejetée
    setRejected((prev) =>
      prev.filter((item) => !allLotProducts.includes(item)),
    );
  };

  const rejectAll = () => {
    const allLotProducts = filtered.map((item) => item.lotProduct);
    setRejected((prev) => [...new Set([...prev, ...allLotProducts])]);
    // Retirer les items rejetés de la liste approuvée
    setApproved((prev) =>
      prev.filter((item) => !allLotProducts.includes(item)),
    );
  };

  const approveItem = (lotProduct: string) => {
    setApproved((prev) => [...new Set([...prev, lotProduct])]);
    // Retirer l'item de la liste rejetée s'il y est
    setRejected((prev) => prev.filter((item) => item !== lotProduct));
  };

  const rejectItem = (lotProduct: string) => {
    setRejected((prev) => [...new Set([...prev, lotProduct])]);
    // Retirer l'item de la liste approuvée s'il y est
    setApproved((prev) => prev.filter((item) => item !== lotProduct));
  };

  const getStatus = (score: number) => {
    if (score >= 0.8) return "approved";
    if (score >= 0.5) return "pending";
    return "rejected";
  };

  const getColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Séparer les items approuvés des autres
  const approvedItems = filtered.filter((item) =>
    approved.includes(item.lotProduct),
  );

  const pendingItems = filtered.filter(
    (item) =>
      !approved.includes(item.lotProduct) &&
      !rejected.includes(item.lotProduct),
  );

  const rejectedItems = filtered.filter((item) =>
    rejected.includes(item.lotProduct),
  );

  return (
    <div className="p-2 space-y-2 max-w-md w-full md:w-105">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-40 h-7 text-xs"
          size={10}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-1">
        <Button
          onClick={() => approveAll()}
          size="sm"
          className="text-[11px] h-7 px-2"
        >
          Valider tous
        </Button>
        <Button
          onClick={() => rejectAll()}
          size="sm"
          className="text-[11px] h-7 px-2"
        >
          Rejeter tous
        </Button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
        {/* Items Approuvés */}
        {approvedItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-1">
              Approuvés ({approvedItems.length})
            </h2>
            <div className="space-y-1.5">
              {approvedItems.map((item: any, index) => {
                const status = getStatus(item.bestMatch?.score);
                const percentage = item.bestMatch
                  ? Math.round(item.bestMatch.score * 100)
                  : 0;

                return (
                  <Card
                    key={`approved-${index}`}
                    className="rounded-md shadow-sm border border-green-500"
                  >
                    <CardContent className="p-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-xs truncate">
                          {item.lotProduct}
                        </h3>
                        <Badge
                          className={`${getColor(
                            status,
                          )} text-white text-[10px] px-1.5 py-0.5`}
                        >
                          {percentage}%
                        </Badge>
                      </div>

                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        {item.bestMatch ? (
                          <span className="font-medium text-foreground">
                            {item.bestMatch.price} €
                          </span>
                        ) : (
                          <span className="text-red-500">No match</span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectItem(item.lotProduct)}
                          className="text-[11px] h-6 px-2"
                        >
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-[11px] h-6 px-2"
                          disabled
                        >
                          Approuvé
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Items en attente */}
        {pendingItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-1">
              En attente ({pendingItems.length})
            </h2>
            <div className="space-y-1.5">
              {pendingItems.map((item: any, index) => {
                const status = getStatus(item.bestMatch?.score);
                const percentage = item.bestMatch
                  ? Math.round(item.bestMatch.score * 100)
                  : 0;

                return (
                  <Card
                    key={`pending-${index}`}
                    className="rounded-md shadow-sm"
                  >
                    <CardContent className="p-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-xs truncate">
                          {item.lotProduct}
                        </h3>
                        <Badge
                          className={`${getColor(
                            status,
                          )} text-white text-[10px] px-1.5 py-0.5`}
                        >
                          {percentage}%
                        </Badge>
                      </div>

                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        {item.bestMatch ? (
                          <span className="font-medium text-foreground">
                            {item.bestMatch.price} €
                          </span>
                        ) : (
                          <span className="text-red-500">No match</span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectItem(item.lotProduct)}
                          className="text-[11px] h-6 px-2 border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-[11px] h-6 px-2"
                          onClick={() => approveItem(item.lotProduct)}
                        >
                          Valider
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Items rejetés */}
        {rejectedItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-1">
              Rejetés ({rejectedItems.length})
            </h2>
            <div className="space-y-1.5">
              {rejectedItems.map((item: any, index) => {
                const status = getStatus(item.bestMatch?.score);
                const percentage = item.bestMatch
                  ? Math.round(item.bestMatch.score * 100)
                  : 0;

                return (
                  <Card
                    key={`rejected-${index}`}
                    className="rounded-md shadow-sm border border-red-500 opacity-90"
                  >
                    <CardContent className="p-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-xs truncate">
                          {item.lotProduct}
                        </h3>
                        <Badge
                          className={`${getColor(
                            status,
                          )} text-white text-[10px] px-1.5 py-0.5`}
                        >
                          {percentage}%
                        </Badge>
                      </div>

                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        {item.bestMatch ? (
                          <span className="font-medium text-foreground">
                            {item.bestMatch.price} €
                          </span>
                        ) : (
                          <span className="text-red-500">No match</span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="text-[11px] h-6 px-2"
                        >
                          Rejeté
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-[11px] h-6 px-2"
                          onClick={() => approveItem(item.lotProduct)}
                        >
                          Valider
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div>
        <Button>Suivant</Button>
      </div>
    </div>
  );
};

export default OffresPages;
