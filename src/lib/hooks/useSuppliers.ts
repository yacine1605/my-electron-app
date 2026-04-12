// hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "../api";
import { toast } from "sonner";

// --- Schemas ---

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  registrationNumber: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional().or(z.literal("")),
  website: z.string().nullable().optional().or(z.literal("")),
  contactPerson: z.string().nullable().optional().or(z.literal("")),
  paymentTerms: z.string().nullable().optional().or(z.literal("")),
  creditLimit: z.string().or(z.number()).nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  notes: z.string().nullable().optional().or(z.literal("")),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  registrationNumber: z.string().optional().or(z.literal("")),
  businessType: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().optional().or(z.literal("")),
  creditLimit: z.string().or(z.number()).optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export type Supplier = z.infer<typeof supplierSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

// --- Queries ---

export const useGetSuppliers = () => {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get<Supplier[]>("suppliers"),
  });
};

// --- Mutations ---

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSupplier: CreateSupplierInput) =>
      api.post<Supplier>("suppliers", newSupplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur ajouté avec succès");
    },
    onError: (error: any) => {
      const message = error?.message || "Erreur lors de l'ajout du fournisseur";
      toast.error(message);
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur supprimé");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la suppression");
    },
  });
};
