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
import {
  CreateSupplierInput,
  useCreateSupplier,
  createSupplierSchema,
} from "@/lib/hooks/useSuppliers";

const initialForm: CreateSupplierInput = {
  name: "",
  email: "",
  phone: "",
  city: "",
  businessType: "",
};

// Catégories médicales courantes
const BUSINESS_TYPES = [
  { value: "equipement_medical", label: "Équipement médical" },
  { value: "dispositifs_medicaux", label: "Dispositifs médicaux" },
  { value: "consommables", label: "Consommables médicaux" },
  { value: "medicaments", label: "Médicaments" },
  { value: "laboratoire", label: "Laboratoire & réactifs" },
  { value: "imagerie", label: "Imagerie médicale" },
  { value: "orthopedie", label: "Orthopédie" },
  { value: "fournitures_hospitalieres", label: "Fournitures hospitalières" },
  { value: "maintenance", label: "Maintenance technique" },
  { value: "autre", label: "Autre" },
];

export const AddSupplierDialog = ({ name }: { name: string }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateSupplierInput>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSupplier = useCreateSupplier();

  const handleChange = (field: keyof CreateSupplierInput, value: string) => {
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

    const result = createSupplierSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    createSupplier.mutate(result.data, {
      onSuccess: () => {
        setOpen(false);
        setForm(initialForm);
        setErrors({});
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="bg-white">
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter {name}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Nouveau {name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 bg-white">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              placeholder={`Nom du ${name}`}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Business Type (Catégorie) */}
          <div className="space-y-2 bg-white">
            <Label htmlFor="businessType">Catégorie</Label>
            <Select
              value={form.businessType ?? ""}
              onValueChange={(value) => handleChange("businessType", value)}
            >
              <SelectTrigger id="businessType">
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-destructive">{errors.businessType}</p>
            )}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={form.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+213 555 000 000"
                value={form.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              placeholder="Alger, Oran, Constantine..."
              value={form.city ?? ""}
              onChange={(e) => handleChange("city", e.target.value)}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
