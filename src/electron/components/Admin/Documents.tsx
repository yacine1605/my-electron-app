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
  CheckCircle2,
  Clock3,
  FileText,
  MoreHorizontal,
  Search,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

type DocumentStatus = "uploaded" | "processing" | "validated" | "rejected";

type DocumentCategory = "Facture" | "Contrat" | "Bon de commande" | "Rapport";

type UploadedDocument = {
  id: string;
  fileName: string;
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: string;
  sizeMb: number;
  status: DocumentStatus;
};

const documentsMock: UploadedDocument[] = [
  {
    id: "1",
    fileName: "facture-sonatrach-avril.pdf",
    category: "Facture",
    uploadedBy: "Mohamed Yacine",
    uploadedAt: "2026-04-10T09:20:00",
    sizeMb: 1.8,
    status: "validated",
  },
  {
    id: "2",
    fileName: "contrat-maintenance-condor.pdf",
    category: "Contrat",
    uploadedBy: "Sara B.",
    uploadedAt: "2026-04-10T11:05:00",
    sizeMb: 2.4,
    status: "processing",
  },
  {
    id: "3",
    fileName: "bon-commande-ooredoo.pdf",
    category: "Bon de commande",
    uploadedBy: "Amine K.",
    uploadedAt: "2026-04-11T08:15:00",
    sizeMb: 0.9,
    status: "uploaded",
  },
  {
    id: "4",
    fileName: "rapport-technique-mobilis.pdf",
    category: "Rapport",
    uploadedBy: "Mohamed Yacine",
    uploadedAt: "2026-04-11T13:40:00",
    sizeMb: 4.2,
    status: "validated",
  },
  {
    id: "5",
    fileName: "contrat-naftal-v2.pdf",
    category: "Contrat",
    uploadedBy: "Nadia M.",
    uploadedAt: "2026-04-11T15:10:00",
    sizeMb: 3.1,
    status: "rejected",
  },
  {
    id: "6",
    fileName: "facture-air-algerie.pdf",
    category: "Facture",
    uploadedBy: "Mohamed Yacine",
    uploadedAt: "2026-04-12T09:00:00",
    sizeMb: 1.2,
    status: "processing",
  },
  {
    id: "7",
    fileName: "rapport-audit-interne.pdf",
    category: "Rapport",
    uploadedBy: "Sara B.",
    uploadedAt: "2026-04-12T10:20:00",
    sizeMb: 5.6,
    status: "uploaded",
  },
  {
    id: "8",
    fileName: "bon-commande-cevital.pdf",
    category: "Bon de commande",
    uploadedBy: "Amine K.",
    uploadedAt: "2026-04-12T11:45:00",
    sizeMb: 1.6,
    status: "validated",
  },
];

const statusLabel: Record<DocumentStatus, string> = {
  uploaded: "Uploadé",
  processing: "En traitement",
  validated: "Validé",
  rejected: "Rejeté",
};

const statusClassName: Record<DocumentStatus, string> = {
  uploaded:
    "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  processing:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  validated:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatSize = (value: number) => {
  return `${value.toFixed(1)} MB`;
};

const fetchDocuments = async (): Promise<UploadedDocument[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return documentsMock;
};

const columns: ColumnDef<UploadedDocument>[] = [
  {
    accessorKey: "fileName",
    header: "Document",
    cell: ({ row }) => {
      return (
        <div className="min-w-55">
          <div className="font-medium text-foreground">
            {row.original.fileName}
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {row.original.id}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie",
    cell: ({ row }) => {
      return <div>{row.original.category}</div>;
    },
  },
  {
    accessorKey: "uploadedBy",
    header: "Uploadé par",
    cell: ({ row }) => {
      return <div>{row.original.uploadedBy}</div>;
    },
  },
  {
    accessorKey: "uploadedAt",
    header: "Date",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground">
          {formatDateTime(row.original.uploadedAt)}
        </div>
      );
    },
  },
  {
    accessorKey: "sizeMb",
    header: "Taille",
    cell: ({ row }) => {
      return <div>{formatSize(row.original.sizeMb)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <Badge variant="outline" className={statusClassName[status]}>
          {statusLabel[status]}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => {
      //        { row }
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
              <DropdownMenuItem>Télécharger</DropdownMenuItem>
              <DropdownMenuItem>Renommer</DropdownMenuItem>
              <DropdownMenuItem className="text-rose-600">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function StatsCards({ data }: { data: UploadedDocument[] }) {
  const totalDocs = data.length;
  const validatedDocs = data.filter(
    (item) => item.status === "validated",
  ).length;
  const processingDocs = data.filter(
    (item) => item.status === "processing",
  ).length;
  const totalSize = data.reduce((sum, item) => sum + item.sizeMb, 0);

  const cards = [
    {
      title: "Total documents",
      value: totalDocs.toString(),
      icon: FileText,
    },
    {
      title: "Validés",
      value: validatedDocs.toString(),
      icon: CheckCircle2,
    },
    {
      title: "En traitement",
      value: processingDocs.toString(),
      icon: Clock3,
    },
    {
      title: "Stockage utilisé",
      value: formatSize(totalSize),
      icon: Upload,
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

export default function DocumentsPage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["uploaded-documents"],
    queryFn: fetchDocuments,
  });

  const filteredData = React.useMemo(() => {
    return data.filter((document) => {
      const matchesSearch =
        document.fileName.toLowerCase().includes(search.toLowerCase()) ||
        document.uploadedBy.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || document.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || document.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [data, search, statusFilter, categoryFilter]);

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
          <h1 className="text-3xl font-bold tracking-tight">
            Documents uploadés
          </h1>
          <p className="text-muted-foreground">
            Gérez les fichiers importés, leur statut et leur historique.
          </p>
        </div>

        <Button className="w-full lg:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Upload document
        </Button>
      </div>

      <StatsCards data={data} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <CardTitle>Bibliothèque documentaire</CardTitle>

          <Separator />

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un fichier ou un utilisateur..."
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-55">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Facture">Facture</SelectItem>
                <SelectItem value="Contrat">Contrat</SelectItem>
                <SelectItem value="Bon de commande">Bon de commande</SelectItem>
                <SelectItem value="Rapport">Rapport</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-55">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="uploaded">Uploadé</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
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
                      Chargement des documents...
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
                      Aucun document trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredData.length} document(s) trouvé(s)
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
