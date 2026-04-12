import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Star } from "lucide-react";
import { Supplier } from "@/lib/hooks/useSuppliers";

// --- Star Rating Component ---
const StarRating = ({ rating }: { rating: number | null | undefined }) => {
  if (rating == null) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  );
};

// --- Business Type Badge Colors ---
const businessTypeColors: Record<string, string> = {
  Matériaux: "bg-blue-100 text-blue-700",
  Équipements: "bg-purple-100 text-purple-700",
  Services: "bg-green-100 text-green-700",
  Transport: "bg-orange-100 text-orange-700",
  Technologie: "bg-cyan-100 text-cyan-700",
  "Sous-traitance": "bg-pink-100 text-pink-700", // 👈 quotes required
};

export const supplierColumns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Nom
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "businessType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("businessType") as string | null;
      if (!type) return <span className="text-muted-foreground">—</span>;
      const colorClass =
        businessTypeColors[type] || "bg-gray-100 text-gray-700";
      return <Badge className={`${colorClass} border-0`}>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Ville
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const city = row.getValue("city") as string | null;
      const country = row.original.country;
      return (
        <span className="text-muted-foreground">
          {city || "—"}
          {country ? `, ${country}` : ""}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null;
      if (!email) return <span className="text-muted-foreground">—</span>;
      return (
        <a
          href={`mailto:${email}`}
          className="text-blue-600 hover:underline truncate block max-w-45"
        >
          {email}
        </a>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null;
      if (!phone) return <span className="text-muted-foreground">—</span>;
      return <span>{phone}</span>;
    },
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("contactPerson") as string | null;
      return (
        <span className={contact ? "" : "text-muted-foreground"}>
          {contact || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Note
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StarRating rating={row.getValue("rating")} />,
  },
  {
    accessorKey: "isActive",
    header: "Statut",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Actif" : "Inactif"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => {
      //{ row }
      //  const supplier = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Eye className="h-4 w-4" /> Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Pencil className="h-4 w-4" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
