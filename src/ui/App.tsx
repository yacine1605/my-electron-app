import { HashRouter, Routes, Route, Navigate } from "react-router";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../layouts/LoginLayout";
import { ProtectedRoute } from "../layouts/ProtectedRoute";
import BpuLayout from "@/layouts/BpuLayout";
import AccountingLayout from "@/layouts/AccountingLayout";
import InvoicesPage from "@/electron/components/modoleC/InvoicesPage";
import PaymentsPage from "@/electron/components/modoleC/PaymentsPage";
import StatsPage from "@/electron/components/modoleC/StatsPage";
import SuppliersPage from "@/electron/components/modoleC/Suppliers";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductsPage from "@/electron/components/modoleC/ProduitsPage";
import OffresPages from "@/electron/components/Bpu/OffresPages";
import P from "@/electron/components/Bpu/P";
import MedicalEntityEmailWizard from "@/electron/components/Bpu/Email";
import { AdminLayout } from "@/layouts/AdminLayout";
import SuppliersAdminPage from "@/electron/components/Admin/fournissuer";

// Création du client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Les données restent fraîches 5 minutes (perf boost!)
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected accountant routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
              <Route
                path="/offers/import"
                element={
                  <div>
                    <OffresPages />
                  </div>
                }
              />
              <Route
                path="/offers/compare"
                element={<MedicalEntityEmailWizard />}
              />
              <Route
                path="/bpu/templates"
                element={
                  <div>
                    <BpuLayout />
                  </div>
                }
              />
              <Route
                path="/bpu/generate"
                element={
                  <div>
                    <P />
                  </div>
                }
              />
              <Route path="/bpu/history" element={<div>History</div>} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/accounting" element={<AccountingLayout />}>
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="stats" element={<StatsPage />} />
              </Route>

              {/* Suppliers Module */}
              {/* <Route path="/suppliers" element={<SuppliersPage />} /> */}
              <Route path="/settings/users" element={<div>Users</div>} />
              <Route path="/settings" element={<div>Settings</div>} />
            </Route>
          </Route>

          <Route
            path="/admin"
            element={
              <div>
                <AdminLayout />
              </div>
            }
          >
            {/* Admin routes */}
            <Route path="dashboard" element={<div>Admin Dashboard</div>} />
            <Route path="/admin/users" element={<div>Manage Users</div>} />
            <Route path="/admin/settings" element={<div>Admin Settings</div>} />
            <Route path="/admin/offers" element={<div>Les Offres</div>} />
            <Route
              path="/admin/bpu/history"
              element={<div>Historique BPU/DGE</div>}
            />
            <Route
              path="/admin/suppliers"
              element={
                <div>
                  <SuppliersAdminPage />
                </div>
              }
            />
            <Route path="/admin/products" element={<div>Produits</div>} />
            <Route
              path="/admin/accounting/payments"
              element={<div>Paiements</div>}
            />
            <Route
              path="/admin/accounting/stats"
              element={<div>Statistiques</div>}
            />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
