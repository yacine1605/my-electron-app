import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Building2,
  Mail,
  MapPin,
  MoreHorizontal,
  PenSquare,
  Phone,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";

type SupplierStatus = "active" | "inactive" | "suspended";

type SupplierCategory =
  | "Informatique"
  | "Transport"
  | "Maintenance"
  | "Services"
  | "Bureau";

type Supplier = {
  id: string;
  code: string;
  name: string;
  category: SupplierCategory;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  status: SupplierStatus;
  totalInvoices: number;
  totalPaid: number;
  lastOfferDate: string;
};

type SupplierFilters = {
  search: string;
  status: SupplierStatus | "all";
  category: SupplierCategory | "all";
};

type SupplierFormValues = {
  code: string;
  name: string;
  category: SupplierCategory;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  status: SupplierStatus;
};

const ALL_CATEGORIES: SupplierCategory[] = [
  "Informatique",
  "Transport",
  "Maintenance",
  "Services",
  "Bureau",
];

const DEFAULT_FORM_VALUES: SupplierFormValues = {
  code: "",
  name: "",
  category: "Informatique",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  status: "active",
};

let MOCK_SUPPLIERS_DB: Supplier[] = [
  {
    id: "sup-001",
    code: "FRN-001",
    name: "SARL Techno Plus",
    category: "Informatique",
    contactName: "Amine Bensaid",
    email: "contact@technoplus.dz",
    phone: "+213 555 10 20 30",
    city: "Alger",
    status: "active",
    totalInvoices: 18,
    totalPaid: 1850000,
    lastOfferDate: "2026-03-28",
  },
  {
    id: "sup-002",
    code: "FRN-002",
    name: "Atlas Transport",
    category: "Transport",
    contactName: "Sofiane Kaci",
    email: "commercial@atlas-transport.dz",
    phone: "+213 661 22 33 44",
    city: "Oran",
    status: "active",
    totalInvoices: 12,
    totalPaid: 1320000,
    lastOfferDate: "2026-04-01",
  },
  {
    id: "sup-003",
    code: "FRN-003",
    name: "Maintenance Pro",
    category: "Maintenance",
    contactName: "Nadia Merabet",
    email: "support@maintenancepro.dz",
    phone: "+213 770 11 44 88",
    city: "Constantine",
    status: "suspended",
    totalInvoices: 9,
    totalPaid: 760000,
    lastOfferDate: "2026-02-17",
  },
  {
    id: "sup-004",
    code: "FRN-004",
    name: "Global Office Supply",
    category: "Bureau",
    contactName: "Yassine Boulahia",
    email: "sales@globaloffice.dz",
    phone: "+213 699 88 77 11",
    city: "Blida",
    status: "active",
    totalInvoices: 24,
    totalPaid: 940000,
    lastOfferDate: "2026-04-06",
  },
  {
    id: "sup-005",
    code: "FRN-005",
    name: "Digi Services",
    category: "Services",
    contactName: "Lina Cherif",
    email: "hello@digiservices.dz",
    phone: "+213 555 90 45 67",
    city: "Sétif",
    status: "inactive",
    totalInvoices: 6,
    totalPaid: 350000,
    lastOfferDate: "2025-12-11",
  },
  {
    id: "sup-006",
    code: "FRN-006",
    name: "Smart IT Distribution",
    category: "Informatique",
    contactName: "Karim Saadi",
    email: "contact@smartit.dz",
    phone: "+213 771 55 44 22",
    city: "Annaba",
    status: "active",
    totalInvoices: 15,
    totalPaid: 2100000,
    lastOfferDate: "2026-04-04",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSupplierId() {
  return `sup-${crypto.randomUUID()}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchSuppliers(filters: SupplierFilters): Promise<Supplier[]> {
  await sleep(400);

  return MOCK_SUPPLIERS_DB.filter((supplier) => {
    const search = filters.search.trim().toLowerCase();

    const matchesSearch =
      search.length === 0 ||
      supplier.name.toLowerCase().includes(search) ||
      supplier.code.toLowerCase().includes(search) ||
      supplier.contactName.toLowerCase().includes(search) ||
      supplier.email.toLowerCase().includes(search) ||
      supplier.city.toLowerCase().includes(search);

    const matchesStatus =
      filters.status === "all" || supplier.status === filters.status;

    const matchesCategory =
      filters.category === "all" || supplier.category === filters.category;

    return matchesSearch && matchesStatus && matchesCategory;
  });
}

async function createSupplier(values: SupplierFormValues): Promise<Supplier> {
  await sleep(500);

  const codeExists = MOCK_SUPPLIERS_DB.some(
    (item) => item.code.toLowerCase() === values.code.toLowerCase(),
  );

  if (codeExists) {
    throw new Error("Le code fournisseur existe déjà.");
  }

  const newSupplier: Supplier = {
    id: generateSupplierId(),
    code: values.code.trim(),
    name: values.name.trim(),
    category: values.category,
    contactName: values.contactName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    status: values.status,
    totalInvoices: 0,
    totalPaid: 0,
    lastOfferDate: todayIsoDate(),
  };

  MOCK_SUPPLIERS_DB = [newSupplier, ...MOCK_SUPPLIERS_DB];

  return newSupplier;
}

async function updateSupplier(
  supplierId: string,
  values: SupplierFormValues,
): Promise<Supplier> {
  await sleep(500);

  const duplicateCode = MOCK_SUPPLIERS_DB.some(
    (item) =>
      item.id !== supplierId &&
      item.code.toLowerCase() === values.code.toLowerCase(),
  );

  if (duplicateCode) {
    throw new Error("Le code fournisseur existe déjà.");
  }

  let updatedSupplier: Supplier | null = null;

  MOCK_SUPPLIERS_DB = MOCK_SUPPLIERS_DB.map((item) => {
    if (item.id !== supplierId) {
      return item;
    }

    updatedSupplier = {
      ...item,
      code: values.code.trim(),
      name: values.name.trim(),
      category: values.category,
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      city: values.city.trim(),
      status: values.status,
    };

    return updatedSupplier;
  });

  if (!updatedSupplier) {
    throw new Error("Fournisseur introuvable.");
  }

  return updatedSupplier;
}

async function deleteSupplier(supplierId: string): Promise<string> {
  await sleep(400);

  const supplier = MOCK_SUPPLIERS_DB.find((item) => item.id === supplierId);

  if (!supplier) {
    throw new Error("Fournisseur introuvable.");
  }

  if (supplier.totalInvoices > 0) {
    throw new Error(
      "Suppression refusée : ce fournisseur possède déjà des factures.",
    );
  }

  MOCK_SUPPLIERS_DB = MOCK_SUPPLIERS_DB.filter(
    (item) => item.id !== supplierId,
  );

  return supplierId;
}

function useSuppliers(filters: SupplierFilters) {
  return useQuery({
    queryKey: ["suppliers", filters],
    queryFn: () => fetchSuppliers(filters),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusLabel(status: SupplierStatus) {
  switch (status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "suspended":
      return "Suspendu";
  }
}

function StatusBadge({ status }: { status: SupplierStatus }) {
  const styles: Record<SupplierStatus, string> = {
    active: "border-green-200 bg-green-50 text-green-700 hover:bg-green-50",
    inactive: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50",
    suspended: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}

type SupplierFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: SupplierFormValues;
  isPending: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierFormValues) => void;
};

function SupplierFormDialog({
  open,
  mode,
  initialValues,
  isPending,
  errorMessage,
  onOpenChange,
  onSubmit,
}: SupplierFormDialogProps) {
  const [values, setValues] = useState<SupplierFormValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues, open]);

  function updateField<K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(values);
  }

  const title =
    mode === "create" ? "Ajouter fournisseur" : "Modifier fournisseur";

  const description =
    mode === "create"
      ? "Créer un nouveau fournisseur dans la base."
      : "Mettre à jour les informations du fournisseur.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-slate-500">{description}</p>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code fournisseur</Label>
              <Input
                id="code"
                value={values.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="FRN-011"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Raison sociale</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Delta Supply"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input
                id="contactName"
                value={values.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="Nom du responsable"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contact@fournisseur.dz"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+213 ..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={values.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Alger"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  updateField("category", value as SupplierCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>

                <SelectContent>
                  {ALL_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  updateField("status", value as SupplierStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Enregistrement..."
                : mode === "create"
                  ? "Ajouter"
                  : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteSupplierDialogProps = {
  supplier: Supplier | null;
  open: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function DeleteSupplierDialog({
  supplier,
  open,
  isPending,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteSupplierDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <span />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce fournisseur ?</AlertDialogTitle>

          <AlertDialogDescription>
            {supplier ? (
              <>
                Cette action supprimera{" "}
                <span className="font-medium text-slate-900">
                  {supplier.name}
                </span>
                . Elle est refusée si le fournisseur possède déjà des factures.
              </>
            ) : (
              "Cette action est irréversible."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SuppliersAdminPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupplierStatus | "all">("all");
  const [category, setCategory] = useState<SupplierCategory | "all">("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      search,
      status,
      category,
    }),
    [search, status, category],
  );

  const { data = [], isLoading, isFetching, refetch } = useSuppliers(filters);

  function invalidateSuppliers() {
    return queryClient.invalidateQueries({
      queryKey: ["suppliers"] as QueryKey,
      exact: false,
    });
  }

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: async () => {
      await invalidateSuppliers();
      setFormOpen(false);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Erreur lors de l'ajout.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      supplierId,
      values,
    }: {
      supplierId: string;
      values: SupplierFormValues;
    }) => updateSupplier(supplierId, values),
    onSuccess: async () => {
      await invalidateSuppliers();
      setFormOpen(false);
      setEditingSupplier(null);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: async () => {
      await invalidateSuppliers();
      setDeleteOpen(false);
      setSupplierToDelete(null);
      setDeleteError(null);
    },
    onError: (error) => {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression.",
      );
    },
  });

  const stats = useMemo(() => {
    const activeCount = data.filter(
      (supplier) => supplier.status === "active",
    ).length;

    const suspendedCount = data.filter(
      (supplier) => supplier.status === "suspended",
    ).length;

    const inactiveCount = data.filter(
      (supplier) => supplier.status === "inactive",
    ).length;

    const totalPaid = data.reduce(
      (sum, supplier) => sum + supplier.totalPaid,
      0,
    );

    return {
      total: data.length,
      activeCount,
      suspendedCount,
      inactiveCount,
      totalPaid,
    };
  }, [data]);

  const formInitialValues = useMemo<SupplierFormValues>(() => {
    if (formMode === "edit" && editingSupplier) {
      return {
        code: editingSupplier.code,
        name: editingSupplier.name,
        category: editingSupplier.category,
        contactName: editingSupplier.contactName,
        email: editingSupplier.email,
        phone: editingSupplier.phone,
        city: editingSupplier.city,
        status: editingSupplier.status,
      };
    }

    return DEFAULT_FORM_VALUES;
  }, [formMode, editingSupplier]);

  function openCreateDialog() {
    setFormMode("create");
    setEditingSupplier(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditDialog(supplier: Supplier) {
    setFormMode("edit");
    setEditingSupplier(supplier);
    setFormError(null);
    setFormOpen(true);
  }

  function openDeleteDialog(supplier: Supplier) {
    setSupplierToDelete(supplier);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function handleFormSubmit(values: SupplierFormValues) {
    setFormError(null);

    if (formMode === "create") {
      createMutation.mutate(values);
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({
        supplierId: editingSupplier.id,
        values,
      });
    }
  }

  function handleDeleteConfirm() {
    if (!supplierToDelete) {
      return;
    }

    setDeleteError(null);
    deleteMutation.mutate(supplierToDelete.id);
  }

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fournisseur
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-slate-100 text-slate-700">
                  {getInitials(supplier.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="font-medium text-slate-900">
                  {supplier.name}
                </div>
                <div className="text-xs text-slate-500">{supplier.code}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Catégorie",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.category}
          </Badge>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <div className="space-y-1 text-sm">
              <div className="font-medium">{supplier.contactName}</div>

              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                <span>{supplier.email}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                <span>{supplier.phone}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "city",
        header: "Ville",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{row.original.city}</span>
          </div>
        ),
      },
      {
        accessorKey: "totalInvoices",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Factures
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "totalPaid",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 px-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total payé
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.totalPaid)}
          </span>
        ),
      },
      {
        accessorKey: "lastOfferDate",
        header: "Dernière offre",
        cell: ({ row }) => formatDate(row.original.lastOfferDate),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => openDeleteDialog(supplier)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Administration</p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Fournisseurs
            </h1>

            <p className="text-sm text-slate-500">
              Ajouter, modifier et supprimer les fournisseurs depuis une seule
              page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>

            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter fournisseur
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total fournisseurs"
            value={String(stats.total)}
            subtitle="Selon les filtres actuels"
            icon={Building2}
          />

          <StatCard
            title="Fournisseurs actifs"
            value={String(stats.activeCount)}
            subtitle={`${stats.inactiveCount} inactifs`}
            icon={Users}
          />

          <StatCard
            title="Fournisseurs suspendus"
            value={String(stats.suspendedCount)}
            subtitle="À surveiller"
            icon={ShieldAlert}
          />

          <StatCard
            title="Montant total payé"
            value={formatCurrency(stats.totalPaid)}
            subtitle="Cumul des fournisseurs affichés"
            icon={Wallet}
          />
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Recherche & filtres</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                placeholder="Rechercher par nom, code, email, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as SupplierCategory | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>

                  {ALL_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as SupplierStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStatus("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Liste des fournisseurs</CardTitle>

            <div className="text-sm text-slate-500">
              {isLoading ? "Chargement..." : `${data.length} résultat(s)`}
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
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
                      {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="align-top">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-slate-500"
                          >
                            Aucun fournisseur trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-500">
                    Page{" "}
                    <span className="font-medium text-slate-900">
                      {table.getState().pagination.pageIndex + 1}
                    </span>{" "}
                    sur{" "}
                    <span className="font-medium text-slate-900">
                      {table.getPageCount()}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Précédent
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SupplierFormDialog
        open={formOpen}
        mode={formMode}
        initialValues={formInitialValues}
        isPending={createMutation.isPending || updateMutation.isPending}
        errorMessage={formError}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingSupplier(null);
            setFormError(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <DeleteSupplierDialog
        supplier={supplierToDelete}
        open={deleteOpen}
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setSupplierToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
