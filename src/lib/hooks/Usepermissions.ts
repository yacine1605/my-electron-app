/**
 * usePermissions
 *
 * Centralises all permission logic so components never compare role strings directly.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can("manage_users")) { ... }
 */

import { useAuthStore, UserRole } from "./Useauthstore";

type Permission =
  // User management
  | "manage_users" // create, edit, delete users
  | "change_user_roles" // promote / demote users

  // Offers
  | "view_offers"
  | "create_offers"
  | "send_offers"
  | "delete_offers"

  // Suppliers
  | "view_suppliers"
  | "manage_suppliers"

  // Analysis
  | "view_analyses"
  | "trigger_analysis"
  | "manual_review"

  // Finance (accountant territory)
  | "view_invoices"
  | "manage_invoices"
  | "view_journal"
  | "manage_journal"

  // Distributor-specific
  | "view_distributor_portal"
  | "submit_proforma";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "manage_users",
    "change_user_roles",
    "view_offers",
    "create_offers",
    "send_offers",
    "delete_offers",
    "view_suppliers",
    "manage_suppliers",
    "view_analyses",
    "trigger_analysis",
    "manual_review",
    "view_invoices",
    "manage_invoices",
    "view_journal",
    "manage_journal",
    "view_distributor_portal",
    "submit_proforma",
  ],

  accountant: [
    "view_offers",
    "view_suppliers",
    "view_analyses",
    "view_invoices",
    "manage_invoices",
    "view_journal",
    "manage_journal",
  ],

  agent_commercial: [
    "view_offers",
    "create_offers",
    "send_offers",
    "view_suppliers",
    "manage_suppliers",
    "view_analyses",
    "trigger_analysis",
    "manual_review",
  ],
  technique: [
    "view_offers",
    "create_offers",
    "send_offers",
    "view_suppliers",
    "manage_suppliers",
    "view_analyses",
    "trigger_analysis",
    "manual_review",
  ],

  distributor: ["view_distributor_portal", "submit_proforma"],
};

export function usePermissions() {
  const { user, hasRole } = useAuthStore();

  /** Check a single named permission */
  function can(permission: Permission): boolean {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }

  /** Check multiple permissions — returns true only if the user has ALL of them */
  function canAll(...permissions: Permission[]): boolean {
    return permissions.every(can);
  }

  /** Check multiple permissions — returns true if the user has ANY of them */
  function canAny(...permissions: Permission[]): boolean {
    return permissions.some(can);
  }

  return {
    can,
    canAll,
    canAny,
    /** Direct role check when you genuinely need it */
    hasRole,
    role: user?.role ?? null,
  };
}
