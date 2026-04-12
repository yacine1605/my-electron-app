export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = "admin" | "accountant" | "viewer";

export const USER_ROLES: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "Administrateur", color: "red" },
  accountant: { label: "Comptable", color: "blue" },
  viewer: { label: "Lecteur", color: "gray" },
};
