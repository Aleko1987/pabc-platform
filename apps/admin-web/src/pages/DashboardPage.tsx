import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ALL_AREAS_FLAT } from "../data/areas";
import { CUSTOMER_RECORDS } from "../data/customers";
import { STAFF_RECORDS } from "../data/staffDirectory";

type Tab = "customers" | "staff" | "areas";

function useGlobalMatches(trimmedQuery: string) {
  return useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return null;
    return {
      customers: CUSTOMER_RECORDS.filter(
        (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
      ),
      staff: STAFF_RECORDS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q),
      ),
      areas: ALL_AREAS_FLAT.filter((a) => a.label.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)),
    };
  }, [trimmedQuery]);
}

export function DashboardPage() {
  const [tab, setTab] = useState<Tab>("customers");
  const [query, setQuery] = useState("");
  const searchQuery = query.trim();
  const globalMatches = useGlobalMatches(searchQuery);
  const isGlobalSearch = searchQuery.length > 0;

  const filteredCustomersTab = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return CUSTOMER_RECORDS;
    return CUSTOMER_RECORDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredStaffTab = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return STAFF_RECORDS;
    return STAFF_RECORDS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredAreasTab = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return ALL_AREAS_FLAT;
    return ALL_AREAS_FLAT.filter((a) => a.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const emptyTab =
    tab === "areas"
      ? filteredAreasTab.length === 0
      : tab === "customers"
        ? filteredCustomersTab.length === 0
        : filteredStaffTab.length === 0;

  const emptyGlobal =
    globalMatches &&
    globalMatches.customers.length === 0 &&
    globalMatches.staff.length === 0 &&
    globalMatches.areas.length === 0;

  return (
    <div className="page dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-search-wrap">
          <label className="visually-hidden" htmlFor="dashboard-search">
            Global search (customers, staff, areas)
          </label>
          <span className="dashboard-search-icon" aria-hidden>
            🔎
          </span>
          <input
            id="dashboard-search"
            type="search"
            className="dashboard-search-input"
            placeholder="Search customers, staff, areas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </header>

      <div className="dashboard-tab-row">
        <button
          type="button"
          className={`dashboard-tab-pill ${tab === "customers" ? "dashboard-tab-pill--active" : ""}`}
          onClick={() => setTab("customers")}
        >
          Customers
        </button>
        <button
          type="button"
          className={`dashboard-tab-pill ${tab === "staff" ? "dashboard-tab-pill--active" : ""}`}
          onClick={() => setTab("staff")}
        >
          Staff
        </button>
        <button
          type="button"
          className={`dashboard-tab-pill ${tab === "areas" ? "dashboard-tab-pill--active" : ""}`}
          onClick={() => setTab("areas")}
        >
          Areas
        </button>
      </div>

      {isGlobalSearch && globalMatches ? (
        <section className="dashboard-global-results" aria-label="Global search results">
          {emptyGlobal ? (
            <p className="dashboard-empty">No matches across customers, staff, or areas.</p>
          ) : (
            <>
              {globalMatches.customers.length > 0 ? (
                <div className="dashboard-global-block">
                  <h2 className="dashboard-global-heading">Customers</h2>
                  <ul className="dashboard-pill-list">
                    {globalMatches.customers.map((c) => (
                      <li key={c.slug}>
                        <Link to={`/customers/${c.slug}`} className="dashboard-pill-link">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {globalMatches.staff.length > 0 ? (
                <div className="dashboard-global-block">
                  <h2 className="dashboard-global-heading">Staff</h2>
                  <ul className="dashboard-pill-list">
                    {globalMatches.staff.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/staff/${s.slug}`} className="dashboard-pill-link">
                          {s.name}
                          <span className="dashboard-pill-meta">{s.role}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {globalMatches.areas.length > 0 ? (
                <div className="dashboard-global-block">
                  <h2 className="dashboard-global-heading">Areas</h2>
                  <ul className="dashboard-pill-list">
                    {globalMatches.areas.map((a) => (
                      <li key={a.slug}>
                        <Link to={`/areas/${a.slug}`} className="dashboard-pill-link">
                          {a.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <div className="dashboard-tab-panel">
          {tab === "customers" ? (
            emptyTab ? (
              <p className="dashboard-empty">No customers match your search.</p>
            ) : (
              <ul className="dashboard-pill-list">
                {filteredCustomersTab.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/customers/${c.slug}`} className="dashboard-pill-link">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "staff" ? (
            emptyTab ? (
              <p className="dashboard-empty">No staff match your search.</p>
            ) : (
              <ul className="dashboard-pill-list">
                {filteredStaffTab.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/staff/${s.slug}`} className="dashboard-pill-link">
                      {s.name}
                      <span className="dashboard-pill-meta">{s.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "areas" ? (
            emptyTab ? (
              <p className="dashboard-empty">No areas match your search.</p>
            ) : (
              <ul className="dashboard-pill-list">
                {filteredAreasTab.map((a) => (
                  <li key={a.slug}>
                    <Link to={`/areas/${a.slug}`} className="dashboard-pill-link">
                      {a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
