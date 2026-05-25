import { useMemo, useState } from "react";

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
interface MatchItem {
  lotProduct: string;
  quantity: number;
  bestMatch?: {
    name: string;
    supplier: string;
    price: number;
    score: number; // 0 → 1
  };
}
// Types
type OffresPageProps = {
  onValidationComplete?: (approved: string[]) => void;
};
interface MatchItem {
  id: string;
  lotProduct: string;
  quantity: number;
  bestMatch?: {
    name: string;
    supplier: string;
    price: number;
    score: number;
  };
}

type ItemState = "pending" | "approved" | "rejected";

const initialData: MatchItem[] = [
  {
    id: "1",
    lotProduct: "Seringue 5ml",
    quantity: 100,
    bestMatch: {
      name: "Seringue jetable 5 ml",
      supplier: "Supplier A",
      price: 8,
      score: 0.92,
    },
  },
  {
    id: "2",
    lotProduct: "Gants latex",
    quantity: 200,
    bestMatch: {
      name: "Gants médicaux latex",
      supplier: "Supplier B",
      price: 5,
      score: 0.76,
    },
  },
  {
    id: "3",
    lotProduct: "Thermomètre digital",
    quantity: 50,
    bestMatch: {
      name: "Thermomètre IR",
      supplier: "Supplier C",
      price: 32,
      score: 0.61,
    },
  },
  {
    id: "4",
    lotProduct: "Compresses stériles",
    quantity: 500,
    bestMatch: {
      name: "Compresses 10x10 stériles",
      supplier: "Supplier A",
      price: 1.2,
      score: 0.88,
    },
  },
  { id: "5", lotProduct: "Cathéter 18G", quantity: 75 },
];
function getScoreVariant(score: number) {
  if (score >= 0.8)
    return { badge: "bg-green-100 text-green-800", bar: "bg-green-500" };
  if (score >= 0.5)
    return { badge: "bg-amber-100 text-amber-800", bar: "bg-amber-400" };
  return { badge: "bg-red-100 text-red-800", bar: "bg-red-500" };
}
// Fake data (replace with API later)
export const OffresPages = ({ onValidationComplete }: OffresPageProps) => {
  const [search, setSearch] = useState("");
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(initialData.map((d) => [d.id, "pending"])),
  );

  const filtered = useMemo(
    () =>
      initialData.filter((d) =>
        d.lotProduct.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const notify = (states: Record<string, ItemState>) => {
    const approved = initialData
      .filter((d) => states[d.id] === "approved")
      .map((d) => d.lotProduct);
    onValidationComplete?.(approved);
  };

  const setState = (id: string, val: ItemState) => {
    setItemStates((prev) => {
      const next = { ...prev, [id]: val };
      notify(next);
      return next;
    });
  };

  const approveAll = () => {
    setItemStates((prev) => {
      const next = { ...prev };
      filtered.forEach((d) => (next[d.id] = "approved"));
      notify(next);
      return next;
    });
  };

  const rejectAll = () => {
    setItemStates((prev) => {
      const next = { ...prev };
      filtered.forEach((d) => (next[d.id] = "rejected"));
      notify(next);
      return next;
    });
  };

  const approved = filtered.filter((d) => itemStates[d.id] === "approved");
  const pending = filtered.filter((d) => itemStates[d.id] === "pending");
  const rejected = filtered.filter((d) => itemStates[d.id] === "rejected");
  const totalApproved = initialData.filter(
    (d) => itemStates[d.id] === "approved",
  ).length;

  const renderCard = (item: MatchItem, compact = false) => {
    const s = itemStates[item.id];
    const hasMatch = !!item.bestMatch;
    const pct = hasMatch ? Math.round(item.bestMatch!.score * 100) : 0;
    const variant = hasMatch ? getScoreVariant(item.bestMatch!.score) : null;

    const borderClass =
      s === "approved"
        ? "border-l-[3px] border-l-green-600 rounded-l-none"
        : s === "rejected"
          ? "border-l-[3px] border-l-red-600 rounded-l-none opacity-75"
          : "";

    const iconWrap =
      s === "approved"
        ? "bg-green-100 text-green-700"
        : s === "rejected"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-500";

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 mb-2 transition-all ${borderClass}`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconWrap}`}
        >
          {s === "approved" ? (
            <CheckIcon />
          ) : s === "rejected" ? (
            <XIcon />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {item.lotProduct}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">
              Qté:{" "}
              <span className="font-medium text-slate-700">
                {item.quantity}
              </span>
            </span>
            {hasMatch ? (
              <>
                <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${variant!.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${variant!.badge}`}
                >
                  {pct}%
                </span>
                <span className="text-xs font-medium text-slate-800">
                  {item.bestMatch!.price.toFixed(2)} €
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.bestMatch!.supplier}
                </span>
              </>
            ) : (
              <span className="text-xs text-red-600">
                Aucune correspondance
              </span>
            )}
          </div>
          {hasMatch && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {item.bestMatch!.name}
            </p>
          )}
        </div>

        {/* Actions — compact ou normal */}
        <div className="flex gap-1.5 shrink-0">
          {s === "approved" ? (
            <>
              {compact ? (
                <button
                  onClick={() => setState(item.id, "rejected")}
                  title="Rejeter"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-green-600 bg-green-50 text-green-800"
                >
                  <CheckIcon />
                </button>
              ) : (
                <>
                  <button className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-green-600 bg-green-50 text-green-800 cursor-default">
                    Approuvé
                  </button>
                  <button
                    onClick={() => setState(item.id, "rejected")}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
                  >
                    Rejeter
                  </button>
                </>
              )}
            </>
          ) : s === "rejected" ? (
            <>
              {compact ? (
                <button
                  onClick={() => setState(item.id, "approved")}
                  title="Valider"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-red-600 bg-red-50 text-red-800"
                >
                  <XIcon size={12} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setState(item.id, "approved")}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                  >
                    Valider
                  </button>
                  <button className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-red-600 bg-red-50 text-red-800 cursor-default">
                    Rejeté
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setState(item.id, "rejected")}
                className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
              >
                Rejeter
              </button>
              <button
                onClick={() => setState(item.id, "approved")}
                className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
              >
                Valider
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const SectionLabel = ({ label, count }: { label: string; count: number }) => (
    <p className="text-[11px] font-medium tracking-widest uppercase text-slate-400 mb-2 mt-4">
      {label} ({count})
    </p>
  );

  return (
    <div className="w-full max-w-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={approveAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-green-600 bg-green-50 text-green-800 hover:bg-green-100 transition-colors"
          >
            <CheckIcon /> Valider tous
          </button>
          <button
            onClick={rejectAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-500 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
          >
            <XIcon size={12} /> Rejeter tous
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Approuvés", count: totalApproved, color: "text-green-700" },
          {
            label: "En attente",
            count: initialData.filter((d) => itemStates[d.id] === "pending")
              .length,
            color: "text-amber-700",
          },
          {
            label: "Rejetés",
            count: initialData.filter((d) => itemStates[d.id] === "rejected")
              .length,
            color: "text-red-700",
          },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
            <p className={`text-xl font-medium ${color}`}>{count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lists */}
      <ScrollArea className="h-105 pr-3">
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Left col — Approuvés */}
          <div>
            {approved.length > 0 && (
              <>
                <SectionLabel label="Approuvés" count={approved.length} />
                {approved.map((item) => renderCard(item, true))}
              </>
            )}
          </div>

          {/* Right col — Rejetés */}
          <div>
            {rejected.length > 0 && (
              <>
                <SectionLabel label="Rejetés" count={rejected.length} />
                {rejected.map((item) => renderCard(item, true))}
              </>
            )}
          </div>

          {/* Full width — En attente */}
          {pending.length > 0 && (
            <div className="col-span-2">
              <SectionLabel label="En attente" count={pending.length} />
              <div className="grid grid-cols-2 gap-3">
                {pending.map((item) => renderCard(item, false))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <p className="col-span-2 text-center text-sm text-slate-400 py-8">
              Aucun produit trouvé
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
{
  /* Footer */
}
{
  /* {totalApproved === 0 && (
        <p className="text-xs text-amber-700 text-center mt-4 bg-amber-50 border border-amber-200 rounded-lg py-2">
          Validez au moins un produit pour continuer
        </p>
      )}
      <button
        disabled={totalApproved === 0}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Exporter et continuer <ArrowUpIcon />
      </button> */
}
export default OffresPages;
