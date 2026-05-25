"use client";

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
import { Product, useUpdateProduct } from "@/lib/hooks/useProducts";

interface Props {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ product, open, onOpenChange }: Props) {
  const [form, setForm] = useState<Partial<Product>>({});
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (open) setForm({ ...product });
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate(
      { id: product.id, ...form },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const update = (field: keyof Product, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={form.name || ""}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">Réf. (SKU)</Label>
              <Input
                id="edit-sku"
                value={form.sku || ""}
                onChange={(e) => update("sku", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Input
                id="edit-category"
                value={form.category || ""}
                onChange={(e) => update("category", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Prix Unitaire</Label>
              <Input
                id="edit-price"
                type="number"
                value={form.unitPrice || ""}
                onChange={(e) => update("unitPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unité de mesure</Label>
              <Input
                id="edit-unit"
                value={form.unitMeasure || ""}
                onChange={(e) => update("unitMeasure", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantité</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={form.quantity ?? ""}
                onChange={(e) => update("quantity", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={form.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateProduct.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
