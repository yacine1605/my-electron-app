import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CreditCard, BarChart3 } from "lucide-react";

export default function AccountingLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the last part of the URL to determine the active tab
  const currentTab = location.pathname.split("/").pop() || "invoices"; // Default to "invoices" if no tab is found
  const handleTabChange = (value: string) => {
    navigate(`/accounting/${value}`);
  };

  return (
    <div className="flex flex-col space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Comptabilité & Suivi
          </h2>
          <p className="text-muted-foreground">
            Suivi des factures, paiements, échéances et statistiques.
          </p>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" /> Factures
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" /> Paiements & Échéances
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Statistiques
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Child routes (InvoicesPage, PaymentsPage, etc.) render here */}
      <div className="mt-2">
        <Outlet />
      </div>
    </div>
  );
}
