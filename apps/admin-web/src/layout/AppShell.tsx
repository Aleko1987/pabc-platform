import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="shell shell--sidebar-hidden">
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
