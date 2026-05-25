// table/columns.tsx
import { Supplier } from "@/electron/types/supplier";
import { ColumnDef } from "@tanstack/react-table";

// ─── Type Badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  ANTISEPTIQUE: {
    label: "Antiseptique",
    className:
      "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  },
  INSTRUMENTATION: {
    label: "Instrumentation",
    className:
      "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  },
};

const TypeBadge = ({ type }: { type: string }) => {
  const config = TYPE_CONFIG[type];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
        {type}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <span
        key={i}
        className={`text-xs ${
          i < value ? "text-amber-500" : "text-muted-foreground/30"
        }`}
      >
        ★
      </span>
    ))}
  </div>
);

// ─── Status Dot ───────────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status: string }) => {
  const isActive = status?.toLowerCase() === "actif";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
          isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
        }`}
      />
      {status}
    </span>
  );
};

// ─── Dash ─────────────────────────────────────────────────────────────────────

const Dash = () => <span className="text-muted-foreground/40">—</span>;

// ─── Column Definitions ───────────────────────────────────────────────────────

export const supplierColumns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Nom",
    size: 200,
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "businessType",
    header: "Type",
    size: 160,
    enableSorting: true,
    cell: ({ getValue }) => <TypeBadge type={getValue<string>()} />,
  },
  {
    accessorKey: "city",
    header: "Ville",
    size: 100,
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? <span className="text-sm">{v}</span> : <Dash />;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 210,
    enableSorting: false,
    cell: ({ getValue }) => {
      const email = getValue<string>();
      if (!email || email === "contacter par telephone") return <Dash />;
      return (
        <a
          href={`mailto:${email}`}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400 truncate block max-w-47.5"
          title={email}
        >
          {email}
        </a>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
    size: 130,
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? <span className="text-sm tabular-nums">{v}</span> : <Dash />;
    },
  },
  {
    accessorKey: "rating",
    header: "Note",
    size: 100,
    enableSorting: true,
    cell: ({ getValue }) => <StarRating value={getValue<number>() ?? 0} />,
  },
  {
    accessorKey: "isActive",
    header: "Statut",
    size: 100,
    enableSorting: true,
    cell: ({ getValue }) => (
      <StatusDot status={getValue<boolean>() ? "Actif" : "Inactif"} />
    ),
  },
];
