import { UserRole } from "@/lib/hooks/Useauthstore";
import { usePermissions } from "@/lib/hooks/Usepermissions";
import { ReactNode } from "react";

type Permission = Parameters<ReturnType<typeof usePermissions>["can"]>[0];

interface RoleGuardProps {
  children: ReactNode;

  /**
   * Render children only when the user has this role (or one of these roles).
   * Use `permission` instead when you want semantic checks.
   */
  role?: UserRole | UserRole[];

  /**
   * Render children only when the user has ALL of these permissions.
   */
  permission?: Permission | Permission[];

  /**
   * Render children when the user has ANY of these permissions.
   */
  anyPermission?: Permission[];

  /**
   * Fallback UI to render when the guard blocks. Defaults to null.
   */
  fallback?: ReactNode;
}

/**
 * RoleGuard — conditionally renders children based on role or permission.
 *
 * Examples:
 *
 *   // Show only to admins
 *   <RoleGuard role="admin">
 *     <DeleteUserButton />
 *   </RoleGuard>
 *
 *   // Show to admins and agent_commercial
 *   <RoleGuard role={["admin", "agent_commercial"]}>
 *     <CreateOfferButton />
 *   </RoleGuard>
 *
 *   // Show only when user can manage invoices
 *   <RoleGuard permission="manage_invoices">
 *     <InvoiceForm />
 *   </RoleGuard>
 *
 *   // Show when user has any of these permissions
 *   <RoleGuard anyPermission={["view_analyses", "manual_review"]}>
 *     <AnalysisBadge />
 *   </RoleGuard>
 *
 *   // Render a placeholder when access is denied
 *   <RoleGuard role="admin" fallback={<p>Admins only</p>}>
 *     <AdminPanel />
 *   </RoleGuard>
 */
export function RoleGuard({
  children,
  role,
  permission,
  anyPermission,
  fallback = null,
}: RoleGuardProps) {
  const { canAll, canAny, hasRole } = usePermissions();

  let allowed = true;

  if (role !== undefined) {
    allowed = allowed && hasRole(role);
  }

  if (permission !== undefined) {
    const perms = Array.isArray(permission) ? permission : [permission];
    allowed = allowed && canAll(...perms);
  }

  if (anyPermission !== undefined) {
    allowed = allowed && canAny(...anyPermission);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
