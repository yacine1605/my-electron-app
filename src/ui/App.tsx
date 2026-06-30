import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/hooks/useAuth";

// Layouts & pages (keep your existing imports)
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../layouts/LoginLayout";
import { TechniqueLayout } from "@/layouts/TechniqueLayout"; // rename file if you want
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/layouts/ProtectedRoute";

import AccountProfilPage from "@/electron/components/Bpu/AccountantUserPage";
import DashboardAccountantPage from "@/electron/components/Bpu/DashboardAccountantPage";
import DashboardTechiniquePage from "@/electron/components/Bpu/DashboardTechiniquePage";
import SuppliersPage from "@/electron/components/modoleC/Suppliers";
import DistributorsPage from "@/electron/components/modoleC/DistributorsPage";
import ProductsPage from "@/electron/components/modoleC/ProduitsPage";
import InvoicesPage from "@/electron/components/modoleC/InvoicesPage";

import OffersPage from "@/electron/components/Bpu/P";
import OffersPageAdmin from "@/electron/components/Bpu/OfferListeAdmin";
import OfferDetailsPage from "@/electron/components/Bpu/offers/OfferDetailsPage";
import OfferDetailsPageT from "@/electron/components/Bpu/offers/OfferDetailsPageT";
import CommercialSendOfferPage from "@/electron/components/Bpu/offers/CommercialSendOfferPage";
import OfferResponsesWrapper from "@/electron/components/Bpu/offers/OfferResponsesWrapper";
import SupplierResponseDetailsPage from "@/electron/components/Bpu/offers/SupplierResponseDetailsPage";
import OfferComparisonPage from "@/electron/components/Bpu/offers/OfferComparisonPage";
import OfferRankingPage from "@/electron/components/Bpu/offers/OfferRankingPage";
import OfferAnalysisPage from "@/electron/components/Bpu/offers/OfferAnalysisPage";

import MedicalEntityEmailWizard from "@/electron/components/Bpu/Email";
import SupplierProforma from "@/electron/components/Bpu/newProforma";

import AgentsPage from "@/electron/components/Admin/Users";
import SuppliersAdminPage from "@/electron/components/Admin/fournissuer";
import FacturesPage from "@/electron/components/Admin/facteur";
import DocumentsPage from "@/electron/components/Admin/Documents";
import OfferDocumentsPage from "@/electron/components/Bpu/offers/OfferDocumentsPage";
import DocumentFoldersListPage from "@/electron/components/modoleC/DocumentFoldersListPage";
import OfferExportsPage from "@/electron/components/Bpu/offers/OfferExportsPage";
import OfferDocumentsLibrary from "@/electron/components/Bpu/offers/OfferDocumentsLibrary";
import DocumentSignatureVerifier from "@/electron/components/Bpu/offers/DocumentSignatureVerifier";
import EditOfferPage from "@/electron/components/Bpu/offers/EditOfferPage";

const DistributorDashboard = () => <div>Distributor Dashboard</div>;
const DistributorPortal = () => <div>Distributor Portal</div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

/** Sends each role to its correct dashboard. */
function HomeRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (userRole) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "technique":
      return <Navigate to="/technique/dashboard" replace />;
    case "agent_commercial":
    case "accountant":
      return <Navigate to="/dashboard" replace />;
    case "distributor":
      return <Navigate to="/distributor/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export function OffersLayout() {
  return (
    <OffersPage>
      <Outlet />
    </OffersPage>
  );
}
export function OffersLayoutAdmin() {
  return (
    <OffersPageAdmin>
      <Outlet />
    </OffersPageAdmin>
  );
}
function EmptyOfferState() {
  return (
    <div className="flex h-full items-center justify-center bg-white text-sm text-muted-foreground">
      Sélectionnez une offre pour voir les détails.
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Root & Public */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── Agent commercial / Accountant ── */}
          <Route element={<ProtectedRoute role="agent_commercial" />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardAccountantPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/distributors" element={<DistributorsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/user" element={<AccountProfilPage />} />
              <Route
                path="/offers/document-folders"
                element={<DocumentFoldersListPage />}
              />
              <Route
                path="/offers/import-files"
                element={<OfferDocumentsLibrary />}
              />
              ;
              <Route path="/offer/liste" element={<OffersLayout />}>
                <Route index element={<EmptyOfferState />} />
                <Route path=":offerId" element={<OfferDetailsPage />} />
                <Route
                  path=":offerId/send"
                  element={<CommercialSendOfferPage />}
                />
                <Route
                  path=":offerId/responses"
                  element={<OfferResponsesWrapper />}
                />
                <Route
                  path=":offerId/responses/:responseId"
                  element={<SupplierResponseDetailsPage />}
                />
                <Route
                  path=":offerId/compare"
                  element={<OfferComparisonPage />}
                />
                <Route path=":offerId/ranking" element={<OfferRankingPage />} />
                <Route
                  path=":offerId/analysis"
                  element={<OfferAnalysisPage />}
                />
                <Route
                  path=":offerId/documents"
                  element={<OfferDocumentsPage />}
                />
              </Route>
            </Route>
          </Route>

          {/* ── Technique ── */}
          <Route element={<ProtectedRoute role="technique" />}>
            <Route path="/technique" element={<TechniqueLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardTechiniquePage />} />
              <Route path="offers/new" element={<MedicalEntityEmailWizard />} />
              <Route path="user" element={<AccountProfilPage />} />
              <Route
                path="files/verification"
                element={<DocumentSignatureVerifier />}
              />
              <Route path="offers/exports" element={<OfferExportsPage />} />
              <Route path="offer/liste" element={<OffersLayout />}>
                <Route index element={<EmptyOfferState />} />
                <Route path=":offerId" element={<OfferDetailsPageT />} />
              </Route>
            </Route>
          </Route>

          {/* ── Admin ── */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="offers" replace />} />
              <Route path="users" element={<AgentsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="Documents" element={<DocumentsPage />} />
              <Route path="payments" element={<InvoicesPage />} />
              <Route path="offers" element={<OffersLayoutAdmin />}>
                <Route path=":offerId/edit" element={<EditOfferPage />} />
              </Route>
              <Route path="distributors" element={<DistributorsPage />} />
              <Route path="stats" element={<div>Statistiques</div>} />
              <Route path="user" element={<AccountProfilPage />} />
            </Route>
          </Route>

          {/* ── Distributor ── */}
          <Route element={<ProtectedRoute role="distributor" />}>
            <Route path="/distributor" element={<MainLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DistributorDashboard />} />
              <Route path="portal" element={<DistributorPortal />} />
              <Route path="user" element={<AccountProfilPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
