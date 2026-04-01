import { NavLink, Outlet } from "react-router-dom";

import { hasSupabaseConfig } from "../config/env";

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">PABC Admin</div>
        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/operations"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Operations
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Settings
          </NavLink>
        </nav>
        {!hasSupabaseConfig && (
          <p className="hint">Supabase env vars not set — shell only.</p>
        )}
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
