import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  AlertCircle,
  ServerOff,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";

/* ─────────────── Types ─────────────── */
type UserRole =
  | "accountant"
  | "technique"
  | "admin"
  | "agent_commercial"
  | "distributor"
  | string;

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string | null;
  role: UserRole;
  createdAt: string;
};

/* ─────────────── API ─────────────── */
const API_BASE = "https://api.digitservz.dz"; // e.g. "http://localhost:3001" or "" if using proxy

const fetchUsers = async (): Promise<User[]> => {
  const url = `${API_BASE}/api/users`;
  console.log("[fetchUsers] GET", url);

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  console.log("[fetchUsers] status:", res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text();
    console.error("[fetchUsers] error body:", text);
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const json = await res.json();
  console.log("[fetchUsers] response JSON:", json);

  // Handle both { data: [...] } and plain array [...]
  const list = Array.isArray(json) ? json : json?.data;
  if (!Array.isArray(list)) {
    throw new Error(
      "La réponse API n'est pas un tableau (attendu json.data ou tableau direct)",
    );
  }

  return list;
};

const deleteUser = async (id: string) => {
  const res = await fetch(`${API_BASE}/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur lors de la suppression");
  return res.json();
};

const createUser = async (payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company?: string;
  phone?: string;
}) => {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la création");
  }
  return res.json();
};

/* ─────────────── Helpers ─────────────── */
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
};

const roleLabel: Record<string, string> = {
  accountant: "Comptable",
  technique: "Technique",
  agent_commercial: "Agent Commercial",
  admin: "Administrateur",
};

const roleClassName: Record<string, string> = {
  accountant: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  technique:
    "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50",
  agent_commercial:
    "border-green-200 bg-green-50 text-green-700 hover:bg-green-50",
  admin: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
};

/* ─────────────── Columns ─────────────── */
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Utilisateur",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(u.firstName, u.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-[12rem]">
            <div className="font-medium text-foreground">
              {u.firstName} {u.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {u.id.slice(0, 8)}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{u.email}</span>
          </div>
          {u.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{u.phone}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge
          variant="outline"
          className={
            roleClassName[role] ?? "border-slate-200 bg-slate-50 text-slate-700"
          }
        >
          {roleLabel[role] ?? role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Société",
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.company ?? "—"}</div>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return <RowActions user={row.original} />;
    },
  },
];

/* ─────────────── Row Actions (Delete) ─────────────── */
function RowActions({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleDelete = () => {
    if (
      window.confirm(
        `Supprimer définitivement ${user.firstName} ${user.lastName} ?`,
      )
    ) {
      del.mutate(user.id);
    }
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Voir profil</DropdownMenuItem>
          <DropdownMenuItem>Modifier</DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={handleDelete}
            disabled={del.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {del.isPending ? "Suppression…" : "Supprimer"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ─────────────── Stats ─────────────── */
function StatsCards({ data }: { data: User[] }) {
  const total = data.length;
  const accountants = data.filter((u) => u.role === "accountant").length;
  const technicians = data.filter((u) => u.role === "technique").length;
  const admins = data.filter((u) => u.role === "admin").length;

  const cards = [
    { title: "Total utilisateurs", value: total.toString(), icon: Users },
    { title: "Comptables", value: accountants.toString(), icon: ShieldCheck },
    { title: "Techniciens", value: technicians.toString(), icon: Activity },
    { title: "Admins", value: admins.toString(), icon: Activity },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────────── Add Dialog ─────────────── */
function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "accountant" as UserRole,
    company: "",
    phone: "",
  });
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "accountant",
        company: "",
        phone: "",
      });
      setError("");
      onSuccess();
    },
    onError: (err: Error) => setError(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError("Email, mot de passe, prénom et nom sont requis.");
      return;
    }
    mutation.mutate({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
      company: form.company || undefined,
      phone: form.phone || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-white" asChild>
        <Button className="w-full lg:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, role: v as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="agent_commercial">
                    Agent Commercial
                  </SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────── Debug Banner ─────────────── */
function DebugBanner({
  error,
  raw,
}: {
  error: Error | null;
  raw: User[] | null;
}) {
  if (!error && (!raw || raw.length > 0)) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1 text-sm">
          {error ? (
            <>
              <p className="font-semibold">Erreur API détectée :</p>
              <code className="block rounded bg-white/60 px-2 py-1 font-mono text-xs">
                {error.message}
              </code>
              <p className="text-xs text-amber-800">
                Vérifiez que votre serveur Express est démarré et accessible.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Réponse API vide</p>
              <p className="text-xs text-amber-800">
                Le backend a répondu avec un tableau vide. Assurez-vous qu'il y
                a bien des lignes dans la table <code>users</code>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Page ─────────────── */
export default function AgentsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const {
    data = [],
    isLoading,
    error,
  } = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const filteredData = useMemo(() => {
    return data.filter((user) => {
      const q = search.toLowerCase();
      const matchesSearch =
        user.firstName.toLowerCase().includes(q) ||
        user.lastName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone ?? "").toLowerCase().includes(q) ||
        (user.company ?? "").toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [data, roleFilter, search]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs, leurs rôles et leurs accès.
          </p>
        </div>

        <AddUserDialog onSuccess={() => {}} />
      </div>

      <StatsCards data={data} />

      {/* ── DEBUG BANNER ── */}
      <DebugBanner error={error ?? null} raw={data.length === 0 ? [] : null} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <CardTitle>Liste des utilisateurs</CardTitle>

          <Separator />

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, email, téléphone…"
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-55">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="accountant">Comptable</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chargement des utilisateurs…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-destructive"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ServerOff className="h-6 w-6" />
                        <span>Impossible de charger les utilisateurs.</span>
                        <span className="text-xs text-muted-foreground">
                          {error.message}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
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
                      className="h-24 text-center text-muted-foreground"
                    >
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredData.length} utilisateur(s) trouvé(s)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Précédent
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
