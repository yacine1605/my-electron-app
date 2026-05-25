// components/products/AddProductDialog.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import {
  CreateProductInput,
  useCreateProduct,
  createProductSchema,
} from "@/lib/hooks/useProducts";
import { useGetSuppliers } from "@/lib/hooks/useSuppliers";

const PRODUCT_CATEGORIES = [
  "Matériaux",
  "Équipement",
  "Service",
  "Outils",
  "Consommable",
  "Autre",
];

const UNIT_MEASURES = [
  "Unité",
  "Kg",
  "Tonne",
  "Mètre",
  "Mètre carré",
  "Mètre cube",
  "Litre",
  "Heure",
  "Forfait",
];

const initialForm: CreateProductInput = {
  supplierId: "",
  name: "",
  sku: "",
  category: "",
  description: "",
  unitPrice: "",
  unitMeasure: "",
  quantity: 0,
  notes: "",
};

export const AddProductDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateProductInput>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProduct = useCreateProduct();
  const { data: suppliers } = useGetSuppliers();

  const handleChange = (field: keyof CreateProductInput, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = createProductSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    createProduct.mutate(result.data, {
      onSuccess: () => {
        setOpen(false);
        setForm(initialForm);
        setErrors({});
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter Produit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-145 max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Nouveau Produit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Supplier */}
          <div className="space-y-2">
            <Label>Fournisseur *</Label>
            <Select
              value={form.supplierId}
              onValueChange={(value) => handleChange("supplierId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && (
              <p className="text-sm text-destructive">{errors.supplierId}</p>
            )}
          </div>

          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                placeholder="Nom du produit"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Réf. (SKU)</Label>
              <Input
                id="sku"
                placeholder="PRD-001"
                value={form.sku ?? ""}
                onChange={(e) => handleChange("sku", e.target.value)}
              />
            </div>
          </div>

          {/* Category + Unit Measure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.category ?? ""}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unité de mesure</Label>
              <Select
                value={form.unitMeasure ?? ""}
                onValueChange={(value) => handleChange("unitMeasure", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_MEASURES.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price + Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prix unitaire</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.unitPrice ?? ""}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={form.quantity ?? ""}
                onChange={(e) =>
                  handleChange(
                    "quantity",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du produit..."
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes internes..."
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
