// components/products/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/lib/hooks/useProducts";

const categoryColors: Record<string, string> = {
  Matériaux: "bg-blue-100 text-blue-700",
  Équipement: "bg-purple-100 text-purple-700",
  Service: "bg-green-100 text-green-700",
  Outils: "bg-orange-100 text-orange-700",
  Consommable: "bg-cyan-100 text-cyan-700",
};

const formatPrice = (price: string | number | null | undefined) => {
  if (price == null) return "—";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 2,
  }).format(num);
};

export const getProductColumns = (
  onEdit: (p: Product) => void,
  onDelete: (p: Product) => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Produit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "sku",
    header: "Réf. (SKU)",
    cell: ({ row }) => {
      const sku = row.getValue("sku") as string | null;
      return (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {sku || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie",
    cell: ({ row }) => {
      const category = row.getValue("category") as string | null;
      if (!category) return <span className="text-muted-foreground">—</span>;
      const colorClass =
        categoryColors[category] || "bg-gray-100 text-gray-700";
      return <Badge className={`${colorClass} border-0`}>{category}</Badge>;
    },
  },
  {
    accessorKey: "supplierName",
    header: "Fournisseur",
    cell: ({ row }) => {
      const supplierName = row.getValue("supplierName") as string | null;
      return (
        <span className={supplierName ? "" : "text-muted-foreground"}>
          {supplierName || row.original.supplierId || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "unitPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Prix Unitaire
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatPrice(row.getValue("unitPrice")),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Quantité
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const qty = row.getValue("quantity") as number | null;
      const unit = row.original.unitMeasure;
      return (
        <span>
          {qty ?? 0}{" "}
          <span className="text-xs text-muted-foreground">{unit || ""}</span>
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(p);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(p);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
