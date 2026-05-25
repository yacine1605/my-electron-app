"use client";

import { useState, useMemo } from "react";
import {
  useGetSuppliers,
  useDeleteSupplier,
  Supplier,
} from "@/lib/hooks/useSuppliers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, SlidersHorizontal, Building2 } from "lucide-react";
import { exportSuppliersToExcel } from "./exportExcel";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { SuppliersTable } from "./SuppliersTable";
import { SupplierStats } from "./SupplierStats";

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useGetSuppliers();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
    null,
  );

  const cities = useMemo(() => {
    if (!suppliers) return [];
    const unique = new Set(suppliers.map((s) => s.city).filter(Boolean));
    return Array.from(unique).sort();
  }, [suppliers]);

  const filtered = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter((s) => {
      const matchesSearch =
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.toLowerCase().includes(search.toLowerCase()) ||
        s.registrationNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? s.isActive
            : !s.isActive;

      const matchesCity = cityFilter === "all" || s.city === cityFilter;

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [suppliers, search, statusFilter, cityFilter]);

  const handleExport = () => {
    if (!filtered.length) return;
    exportSuppliersToExcel(filtered);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto  bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Gestion des Fournisseurs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {suppliers?.length || 0} fournisseurs enregistrés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!filtered.length}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
          <AddSupplierDialog name="Fournisseur" />
        </div>
      </div>

      <SupplierStats suppliers={suppliers || []} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone, RC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(v: "all" | "active" | "inactive") =>
              setStatusFilter(v)
            }
          >
            <SelectTrigger className="w-40">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SuppliersTable
        data={filtered}
        isLoading={isLoading}
        onEdit={setEditingSupplier} // ✅ make sure this is present
        onDelete={setDeletingSupplier} // ✅ make sure this is present
      />

      {editingSupplier && (
        <EditSupplierDialog
          supplier={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
        />
      )}

      {deletingSupplier && (
        <DeleteSupplierDialog
          supplier={deletingSupplier}
          open={!!deletingSupplier}
          onOpenChange={(open) => !open && setDeletingSupplier(null)}
          onConfirm={() => {
            deleteSupplier.mutate(deletingSupplier.id, {
              onSuccess: () => setDeletingSupplier(null),
            });
          }}
          isPending={deleteSupplier.isPending}
        />
      )}
    </div>
  );
}
