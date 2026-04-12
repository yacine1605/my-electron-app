// pages/ProductsPage.tsx
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetProducts } from "@/lib/hooks/useProducts";
import { DataTable } from "../Bpu/data-table";
import { AddProductDialog } from "./products/AddProductDialog";
import { productColumns } from "./products/columns";

const ProductsPage = () => {
  const { data: products, isLoading, error } = useGetProducts();
  const [search, setSearch] = useState("");

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">
          Erreur de chargement: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produits</h2>
          <p className="text-muted-foreground">
            Catalogue produits, prix et stocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddProductDialog />
          <Button variant="outline">Import CSV</Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {products ? `${products.length} produits` : "Chargement..."}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      ) : (
        <DataTable
          columns={productColumns}
          data={products ?? []}
          //searchKey="name"
          // searchValue={search}
        />
      )}
    </div>
  );
};
export default ProductsPage;
