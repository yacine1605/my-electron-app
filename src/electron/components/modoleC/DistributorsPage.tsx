import { useState, useMemo } from "react";
import {
  Search,
  Upload,
  Plus,
  Filter,
  MapPin,
  SlidersHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetDistributors } from "@/lib/hooks/useDistrbutors";
import { AddDistributorDialog } from "../Bpu/offers/AddDistributorDialog";
import { apiClient } from "@/lib/hooks/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Distributor {
  id: string;
  name: string;
  registrationNumber?: string | null;
  businessType?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  rating?: number | null;
  isActive?: boolean | null;
}

// ── API mutations ─────────────────────────────────────────────────────────────

const deleteDistributor = (id: string) =>
  apiClient.delete(`distributors/${id}`).json();

const updateDistributor = (id: string, data: Partial<Distributor>) =>
  apiClient.put(`distributors/${id}`, { json: data }).json();

// ── Sub-components ────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
  ANTISEPTIQUE:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  INSTRUMENTATION:
    "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
};

const BADGE_LABELS: Record<string, string> = {
  ANTISEPTIQUE: "Antiseptique",
  INSTRUMENTATION: "Instrumentation",
};

const TypeBadge = ({ type }: { type?: string | null }) => {
  if (!type) return <Dash />;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        BADGE_STYLES[type] ??
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      }`}
    >
      {BADGE_LABELS[type] ?? type}
    </span>
  );
};

const StarRating = ({
  value = 0,
  max = 5,
}: {
  value?: number | null;
  max?: number;
}) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <span
        key={i}
        className={`text-xs ${i < (value ?? 0) ? "text-amber-500" : "text-border"}`}
      >
        ★
      </span>
    ))}
  </div>
);

const StatusDot = ({ active }: { active?: boolean | null }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
        active ? "bg-emerald-500" : "bg-muted-foreground/30"
      }`}
    />
    {active ? "Actif" : "Inactif"}
  </span>
);

const Dash = () => <span className="text-muted-foreground/40 text-sm">—</span>;

const StatCard = ({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) => (
  <div className="bg-muted/50 rounded-lg px-4 py-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-medium ${valueClass ?? ""}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

// ── Dropdown filter ───────────────────────────────────────────────────────────

const FilterDropdown = ({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const isActive = value !== "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors ${
          isActive
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
            : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Icon size={13} />
        {isActive ? value : label}
        {isActive ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={12} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 min-w-37.5 rounded-lg border border-border bg-background shadow-md py-1 text-sm">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-muted-foreground text-xs">
                Aucune option
              </p>
            ) : (
              options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt === value ? "" : opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-muted transition-colors ${
                    opt === value
                      ? "text-blue-600 font-medium dark:text-blue-400"
                      : "text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Delete confirmation dialog ────────────────────────────────────────────────

const DeleteConfirmDialog = ({
  distributor,
  onConfirm,
  onCancel,
  isPending,
}: {
  distributor: Distributor;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => (
  <>
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-medium text-base">Supprimer le distributeur</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-medium text-foreground">
            {distributor.name}
          </span>{" "}
          ? Cette action est irréversible.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-md border border-border text-sm bg-background hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="h-9 px-4 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isPending && (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </>
);

// ── Inline edit row ───────────────────────────────────────────────────────────

const EditRow = ({
  distributor,
  onSave,
  onCancel,
  isPending,
}: {
  distributor: Distributor;
  onSave: (data: Partial<Distributor>) => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  const [form, setForm] = useState({
    name: distributor.name ?? "",
    email: distributor.email ?? "",
    phone: distributor.phone ?? "",
    city: distributor.city ?? "",
    businessType: distributor.businessType ?? "",
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls =
    "h-8 w-full rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <tr className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-border">
      <td className="px-3.5 py-2">
        <input
          className={inputCls}
          value={form.name}
          onChange={set("name")}
          placeholder="Nom"
        />
      </td>
      <td className="px-3.5 py-2">
        <select
          className={inputCls}
          value={form.businessType}
          onChange={set("businessType")}
        >
          <option value="">—</option>
          <option value="ANTISEPTIQUE">Antiseptique</option>
          <option value="INSTRUMENTATION">Instrumentation</option>
        </select>
      </td>
      <td className="px-3.5 py-2">
        <input
          className={inputCls}
          value={form.city}
          onChange={set("city")}
          placeholder="Ville"
        />
      </td>
      <td className="px-3.5 py-2">
        <input
          className={inputCls}
          value={form.email}
          onChange={set("email")}
          placeholder="Email"
          type="email"
        />
      </td>
      <td className="px-3.5 py-2">
        <input
          className={inputCls}
          value={form.phone}
          onChange={set("phone")}
          placeholder="Téléphone"
        />
      </td>
      <td className="px-3.5 py-2">
        <StarRating value={distributor.rating} />
      </td>
      <td className="px-3.5 py-2">
        <StatusDot active={distributor.isActive} />
      </td>
      <td className="px-3.5 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onSave(form)}
            disabled={isPending}
            className="h-7 px-2.5 rounded-md text-xs bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors"
          >
            {isPending ? "…" : "Sauv."}
          </button>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const DistributorsPage = () => {
  const queryClient = useQueryClient();
  const { data: distributors, isLoading, error } = useGetDistributors();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Distributor | null>(null);

  // ── Unique filter options derived from data ──
  const typeOptions = useMemo(
    () =>
      [
        ...new Set(
          (distributors ?? [])
            .map((d: Distributor) => d.businessType)
            .filter(Boolean),
        ),
      ] as string[],
    [distributors],
  );
  const cityOptions = useMemo(
    () =>
      [
        ...new Set(
          (distributors ?? []).map((d: Distributor) => d.city).filter(Boolean),
        ),
      ] as string[],
    [distributors],
  );

  // ── Filtered rows ──
  const filtered = useMemo(() => {
    if (!distributors) return [];
    return distributors.filter((d: Distributor) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q);
      const matchType = !filterType || d.businessType === filterType;
      const matchCity = !filterCity || d.city === filterCity;
      const matchStatus =
        !filterStatus || (filterStatus === "Actif" ? d.isActive : !d.isActive);
      return matchSearch && matchType && matchCity && matchStatus;
    });
  }, [distributors, search, filterType, filterCity, filterStatus]);

  // ── Stats ──
  const total = distributors?.length ?? 0;
  const activeCount =
    distributors?.filter((d: Distributor) => d.isActive).length ?? 0;
  const avgRating =
    total > 0
      ? (
          distributors!.reduce(
            (sum: number, d: Distributor) => sum + (d.rating ?? 0),
            0,
          ) / total
        ).toFixed(1)
      : "—";

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDistributor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      setDeleteTarget(null);
    },
  });

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Distributor> }) =>
      updateDistributor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      setEditId(null);
    },
  });

  const hasActiveFilters = filterType || filterCity || filterStatus;

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive text-sm">
          Erreur de chargement : {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Distributeurs</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Base de données, catégories et historique des offres.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-sm bg-background hover:bg-muted transition-colors">
            <Upload size={14} />
            Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus size={14} />
            Ajouter un distributeur
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-2.5">
        <StatCard
          label="Total distributeurs"
          value={total}
          sub="+3 ce mois-ci"
        />
        <StatCard
          label="Actifs"
          value={activeCount}
          sub={
            total > 0
              ? `${Math.round((activeCount / total) * 100)}% du total`
              : ""
          }
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Note moyenne"
          value={`${avgRating} / 5`}
          sub={`Sur ${total} évaluations`}
        />
        <StatCard
          label="Réponses négatives"
          value={0}
          sub="Depuis 30 jours"
          valueClass="text-red-600 dark:text-red-400"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
          />
        </div>

        <FilterDropdown
          label="Type"
          icon={Filter}
          options={typeOptions}
          value={filterType}
          onChange={setFilterType}
        />
        <FilterDropdown
          label="Ville"
          icon={MapPin}
          options={cityOptions}
          value={filterCity}
          onChange={setFilterCity}
        />
        <FilterDropdown
          label="Statut"
          icon={SlidersHorizontal}
          options={["Actif", "Inactif"]}
          value={filterStatus}
          onChange={setFilterStatus}
        />

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterType("");
              setFilterCity("");
              setFilterStatus("");
            }}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={12} />
            Réinitialiser
          </button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {isLoading
            ? "Chargement…"
            : `${filtered.length} distributeur${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Chargement des distributeurs…
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <table className="w-full text-sm border-collapse">
            <colgroup>
              <col style={{ width: 220 }} />
              <col style={{ width: 155 }} />
              <col style={{ width: 105 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 135 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  "Nom",
                  "Type",
                  "Ville",
                  "Email",
                  "Téléphone",
                  "Note",
                  "Statut",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-3.5 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Aucun distributeur trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((d: Distributor) =>
                  editId === d.id ? (
                    <EditRow
                      key={d.id}
                      distributor={d}
                      isPending={updateMutation.isPending}
                      onSave={(data) =>
                        updateMutation.mutate({ id: d.id, data })
                      }
                      onCancel={() => setEditId(null)}
                    />
                  ) : (
                    <tr
                      key={d.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-3.5 py-3">
                        <p className="font-medium text-sm leading-tight">
                          {d.name}
                        </p>
                        {d.registrationNumber && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {d.registrationNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <TypeBadge type={d.businessType} />
                      </td>
                      <td className="px-3.5 py-3">
                        {d.city ? (
                          <span className="text-sm">{d.city}</span>
                        ) : (
                          <Dash />
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        {d.email ? (
                          <a
                            href={`mailto:${d.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-45"
                            title={d.email}
                          >
                            {d.email}
                          </a>
                        ) : (
                          <Dash />
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        {d.phone ? (
                          <span className="tabular-nums text-sm">
                            {d.phone}
                          </span>
                        ) : (
                          <Dash />
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <StarRating value={d.rating} />
                      </td>
                      <td className="px-3.5 py-3">
                        <StatusDot active={d.isActive} />
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditId(d.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(d)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors dark:hover:bg-red-950 dark:hover:border-red-800"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add dialog ── */}
      <AddDistributorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => {}}
      />

      {/* ── Delete confirm dialog ── */}
      {deleteTarget && (
        <DeleteConfirmDialog
          distributor={deleteTarget}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DistributorsPage;
