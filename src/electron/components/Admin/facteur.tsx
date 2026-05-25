import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
};

const invoicesMock: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "FAC-2026-001",
    clientName: "Sonatrach",
    date: "2026-04-01",
    amount: 125000,
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "FAC-2026-002",
    clientName: "Mobilis",
    date: "2026-04-03",
    amount: 84500,
    status: "pending",
  },
  {
    id: "3",
    invoiceNumber: "FAC-2026-003",
    clientName: "Ooredoo",
    date: "2026-04-04",
    amount: 45300,
    status: "overdue",
  },
  {
    id: "4",
    invoiceNumber: "FAC-2026-004",
    clientName: "Condor",
    date: "2026-04-05",
    amount: 97000,
    status: "paid",
  },
  {
    id: "5",
    invoiceNumber: "FAC-2026-005",
    clientName: "Cevital",
    date: "2026-04-06",
    amount: 212000,
    status: "draft",
  },
  {
    id: "6",
    invoiceNumber: "FAC-2026-006",
    clientName: "Djezzy",
    date: "2026-04-08",
    amount: 66500,
    status: "pending",
  },
  {
    id: "7",
    invoiceNumber: "FAC-2026-007",
    clientName: "Air Algérie",
    date: "2026-04-09",
    amount: 119000,
    status: "paid",
  },
  {
    id: "8",
    invoiceNumber: "FAC-2026-008",
    clientName: "Naftal",
    date: "2026-04-10",
    amount: 38800,
    status: "overdue",
  },
];

const statusLabel: Record<InvoiceStatus, string> = {
  paid: "Payée",
  pending: "En attente",
  overdue: "En retard",
  draft: "Brouillon",
};

const statusVariantClass: Record<InvoiceStatus, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  overdue: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
  draft: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const fetchInvoices = async (): Promise<Invoice[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return invoicesMock;
};

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Numéro",
    cell: ({ row }) => {
      return (
        <div className="font-medium text-foreground">
          {row.original.invoiceNumber}
        </div>
      );
    },
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => {
      return <div>{row.original.clientName}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground">
          {formatDate(row.original.date)}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Montant",
    cell: ({ row }) => {
      return (
        <div className="font-medium">{formatCurrency(row.original.amount)}</div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <Badge variant="outline" className={statusVariantClass[status]}>
          {statusLabel[status]}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const invoice = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Voir</DropdownMenuItem>
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuItem>
                Télécharger {invoice.invoiceNumber}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function StatsCards({ data }: { data: Invoice[] }) {
  const totalInvoices = data.length;
  const paidInvoices = data.filter((item) => item.status === "paid").length;
  const pendingInvoices = data.filter(
    (item) => item.status === "pending",
  ).length;
  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);

  const cards = [
    {
      title: "Total factures",
      value: totalInvoices.toString(),
      icon: Receipt,
    },
    {
      title: "Payées",
      value: paidInvoices.toString(),
      icon: TrendingUp,
    },
    {
      title: "En attente",
      value: pendingInvoices.toString(),
      icon: Receipt,
    },
    {
      title: "Montant total",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
    },
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

export default function FacturesPage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const filteredData = React.useMemo(() => {
    return data.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">
            Gérez, filtrez et suivez vos factures clients.
          </p>
        </div>

        <Button className="w-full lg:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      <StatsCards data={data} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Liste des factures</CardTitle>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par numéro ou client..."
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-55">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
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
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
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
                      Chargement des factures...
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
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredData.length} facture(s) trouvée(s)
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
