import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/lib/hooks/useAuth";

export type UserRole =
  | "admin"
  | "accountant"
  | "agent_commercial"
  | "distributor"
  | "technique";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  accountant: "/dashboard",
  agent_commercial: "/dashboard",
  distributor: "/distributor/dashboard",
  technique: "/technique/dashboard",
};

export function ProtectedRoute({ role }: { role: UserRole }) {
  // Select primitives only — never the whole store object
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash/redirect loops before Zustand rehydrates from localStorage
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated || !userRole) {
    return <Navigate to="/login" replace />;
  }

  // Backend default role is "accountant" — treat it as "agent_commercial"
  const effectiveRole =
    userRole === "accountant" ? "agent_commercial" : userRole;

  if (effectiveRole !== role) {
    // Wrong role → send to correct home instead of looping
    const home = ROLE_HOME[userRole] || "/login";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
