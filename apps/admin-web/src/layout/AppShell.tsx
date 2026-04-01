import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { hasSupabaseConfig, hideAdminSidebar } from "../config/env";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`shell ${hideAdminSidebar ? "shell--sidebar-hidden" : ""} ${
        sidebarOpen ? "shell--sidebar-open" : ""
      }`}
    >
      {!hideAdminSidebar ? (
        <button
          type="button"
          className="shell-menu-btn"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {sidebarOpen ? "Close" : "Menu"}
        </button>
      ) : null}

      <aside id="app-sidebar" className="sidebar">
        <div className="brand">PABC Admin</div>
        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setSidebarOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/operations"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setSidebarOpen(false)}
          >
            Operations
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setSidebarOpen(false)}
          >
            Settings
          </NavLink>
        </nav>
        {!hasSupabaseConfig && (
          <p className="hint">Supabase env vars not set — shell only.</p>
        )}
      </aside>
      {!hideAdminSidebar ? (
        <button
          type="button"
          className="shell-overlay"
          aria-hidden={!sidebarOpen}
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
