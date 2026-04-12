import { SidebarAdmin } from "@/electron/components/layout/SidebarAdmin";
import { Titlebar } from "../electron/components/layout/Titlebar";
import { Outlet } from "react-router";

export function AdminLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <SidebarAdmin />
        <main className="flex-1 overflow-y-auto bg-surface-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
