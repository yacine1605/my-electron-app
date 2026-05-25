import { NavLink } from "react-router";
import {
  LayoutDashboard,
  GitCompare,
  Users,
  //LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  group: string;
}

const navItems: NavItem[] = [
  {
    label: "Tableau de bord",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/",
    group: "Général",
  },
  {
    label: "Creation Des offres",
    icon: <GitCompare className="w-5 h-5" />,
    path: "offers/new",
    group: "Offres",
  },
  {
    label: "Excel offres",
    icon: <GitCompare className="w-5 h-5" />,
    path: "offers/exports",
    group: "Offres",
  },

  {
    label: "Utilisateurs",
    icon: <Users className="w-5 h-5" />,
    path: "user",
    group: "Paramètres",
  },
  // {
  //   label: "Paramètres",
  //   icon: <Settings className="w-5 h-5" />,
  //   path: "/settings",
  //   group: "Paramètres",
  // },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  // const location = useLocation();

  const groups = [...new Set(navItems.map((item) => item.group))];

  return (
    <aside
      className={cn(
        "h-full bg-white border-r border-surface-200 flex flex-col transition-all duration-300",
        collapsed ? "w-17" : "w-65",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-200">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">FK</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              FK PHARM
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Gestion des offres
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group}
              </p>
            )}
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 mb-0.5",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-surface-50 hover:text-gray-900",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-200 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-surface-50 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform",
              collapsed && "rotate-180",
            )}
          />
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
