import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "../api";
import { toast } from "sonner";

// --- Schemas ---

export const productSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string().optional(), // useful for display
  name: z.string(),
  sku: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  unitPrice: z.string().or(z.number()).nullable().optional(),
  unitMeasure: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  specifications: z.any().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createProductSchema = z.object({
  supplierId: z.string().min(1, "Le fournisseur est requis"),
  name: z.string().min(1, "Le nom du produit est requis"),
  sku: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  unitPrice: z.string().or(z.number()).optional(),
  unitMeasure: z.string().optional().or(z.literal("")),
  quantity: z.number().optional(),
  specifications: z.any().optional(),
  notes: z.string().optional().or(z.literal("")),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;

// --- Clean payload before sending ---
const cleanPayload = (data: CreateProductInput) => ({
  ...data,
  sku: data.sku || null,
  category: data.category || null,
  description: data.description || null,
  unitMeasure: data.unitMeasure || null,
  notes: data.notes || null,
  unitPrice: data.unitPrice ? Number(data.unitPrice) : null,
  quantity: data.quantity ?? 0,
});

// --- Queries ---

export const useGetProducts = () => {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("products"),
  });
};

// --- Mutations ---

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProduct: CreateProductInput) =>
      api.post<Product>("products", cleanPayload(newProduct)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit ajouté avec succès");
    },
    onError: (error: any) => {
      const message = error?.message || "Erreur lors de l'ajout du produit";
      toast.error(message);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit supprimé");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la suppression");
    },
  });
};
