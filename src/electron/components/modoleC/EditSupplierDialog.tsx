import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Supplier, useUpdateSupplier } from "@/lib/hooks/useSuppliers";

interface Props {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange }: Props) {
  const [form, setForm] = useState<Partial<Supplier>>({});
  const updateSupplier = useUpdateSupplier();

  useEffect(() => {
    if (open) setForm({ ...supplier });
  }, [open, supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupplier.mutate(
      { id: supplier.id, ...form },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const update = (field: keyof Supplier, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Modifier le fournisseur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={form.name || ""}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Ville</Label>
              <Input
                id="edit-city"
                value={form.city || ""}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rc">N° Registre</Label>
              <Input
                id="edit-rc"
                value={form.registrationNumber || ""}
                onChange={(e) => update("registrationNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type d'activité</Label>
              <Input
                id="edit-type"
                value={form.businessType || ""}
                onChange={(e) => update("businessType", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSupplier.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
