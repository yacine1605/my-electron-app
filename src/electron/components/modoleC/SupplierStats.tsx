import { Supplier } from "@/lib/hooks/useSuppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle, Star } from "lucide-react";

export function SupplierStats({ suppliers }: { suppliers: Supplier[] }) {
  const total = suppliers.length;
  const active = suppliers.filter((s) => s.isActive).length;
  const inactive = total - active;
  const rated = suppliers.filter((s) => (s.rating || 0) > 0).length;

  const stats = [
    {
      title: "Total Fournisseurs",
      value: total,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Actifs",
      value: active,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Inactifs",
      value: inactive,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Évalués",
      value: rated,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.title}
            </CardTitle>
            <div className={`${s.bg} p-2 rounded-md`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
