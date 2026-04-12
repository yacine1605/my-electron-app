import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star } from "lucide-react";
import { Supplier, useGetSuppliers } from "@/lib/hooks/useSuppliers";

const SuppliersTable: React.FC = () => {
  const { data: suppliers, isLoading, isError } = useGetSuppliers();

  // 1. On définit explicitement le type des colonnes avec ColumnDef<Supplier>
  const columns = useMemo<ColumnDef<Supplier, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nom du Fournisseur",
      },
      {
        accessorKey: "city",
        header: "Ville",
      },
      {
        accessorKey: "phone",
        header: "Téléphone",
      },
      {
        accessorKey: "rating",
        header: "Note",
        cell: ({ row }) => {
          const rating = row.original.rating || 0;
          return (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{rating}/5</span>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Statut",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "destructive"}>
            {row.original.isActive ? "Actif" : "Inactif"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => (
          <Button variant="ghost" size="sm">
            Voir Détails
          </Button>
        ),
      },
    ],
    [],
  );

  // 2. On passe explicitement le type générique <Supplier> à useReactTable
  const table = useReactTable<Supplier>({
    data: suppliers ?? [], // Utilisation de ?? [] au lieu de || [] pour le typage
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center">
        Erreur de chargement des fournisseurs.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Aucun fournisseur trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SuppliersTable;
