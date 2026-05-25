import { Outlet } from "react-router";
import { Sidebar } from "../electron/components/layout/SidebarTechinique";
import { Titlebar } from "../electron/components/layout/Titlebar";

export function TechniqueLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
