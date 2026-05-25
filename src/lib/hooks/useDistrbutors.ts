// hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "../api";
import { toast } from "sonner";

// --- Schemas ---

export const distributorSchema = z.object({
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

export const createDistributorSchema = z.object({
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

export type Distributor = z.infer<typeof distributorSchema>;
export type CreateDistributorInput = z.infer<typeof createDistributorSchema>;

// --- Queries ---

export const useGetDistributors = () => {
  return useQuery<Distributor[]>({
    queryKey: ["distributors"],
    queryFn: () => api.get<Distributor[]>("distributors"),
  });
};

// --- Mutations ---

export const useCreateDistributor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newDistributor: CreateDistributorInput) =>
      api.post<Distributor>("distributors", newDistributor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      toast.success("Distributeur ajouté avec succès");
    },
    onError: (error: any) => {
      const message =
        error?.message || "Erreur lors de l'ajout du distributeur";
      toast.error(message);
    },
  });
};

export const useDeleteDistributor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`distributors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      toast.success("Distributeur supprimé");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la suppression");
    },
  });
};
