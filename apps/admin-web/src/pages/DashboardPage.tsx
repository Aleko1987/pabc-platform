import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import pabcLogo from "../assets/pabc-logo.png";
import { CUSTOMER_RECORDS } from "../data/customers";
import { RosterPage } from "./RosterPage";
import { STAFF_RECORDS } from "../data/staffDirectory";

type Tab = "customers" | "staff";
const DND_MIME = "application/x-pabc-roster";

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
    };
  }, [trimmedQuery]);
}

export function DashboardPage() {
  const [tab, setTab] = useState<Tab>("customers");
  const [query, setQuery] = useState("");
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [selectedCustomerSlugs, setSelectedCustomerSlugs] = useState<string[]>([]);
  const searchQuery = query.trim();
  const globalMatches = useGlobalMatches(searchQuery);
  const isGlobalSearch = searchQuery.length > 0;
  const selectedCustomerNames = selectedCustomerSlugs
    .map((slug) => CUSTOMER_RECORDS.find((c) => c.slug === slug)?.name ?? slug)
    .filter(Boolean);

  const allRecipients = useMemo(() => {
    const names = CUSTOMER_RECORDS.flatMap((c) => c.sites.flatMap((s) => s.guards));
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, []);

  const toggleCustomerFilter = (slug: string) => {
    setSelectedCustomerSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const sendGlobalMessage = () => {
    if (selectedCustomerNames.length > 0) {
      const targetLabel = selectedCustomerNames.join(", ");
      const body = window.prompt(`Message to ${targetLabel}:`, "Team check-in: confirm site status by 18:00.");
      if (!body || !body.trim()) return;
      setBroadcastNotice(`Message sent to selected customers (${selectedCustomerNames.length}).`);
      return;
    }
    if (allRecipients.length === 0) return;
    const body = window.prompt("Message to send to all groups:", "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to all groups (${allRecipients.length} recipients).`);
  };

  const sendGlobalVoice = () => {
    if (selectedCustomerNames.length > 0) {
      const targetLabel = selectedCustomerNames.join(", ");
      const note = window.prompt(`Voice note label for ${targetLabel}:`, "Shift handover briefing");
      if (!note || !note.trim()) return;
      setBroadcastNotice(`Voice note sent to selected customers (${selectedCustomerNames.length}).`);
      return;
    }
    if (allRecipients.length === 0) return;
    const note = window.prompt("Voice note label:", "Shift handover briefing");
    if (!note || !note.trim()) return;
    setBroadcastNotice(`Voice note sent to all groups (${allRecipients.length} recipients).`);
  };

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

  const emptyTab = tab === "customers" ? filteredCustomersTab.length === 0 : filteredStaffTab.length === 0;
  const emptyGlobal =
    globalMatches &&
    globalMatches.customers.length === 0 &&
    globalMatches.staff.length === 0;

  return (
    <div className={`dashboard-shell ${showSideMenu ? "dashboard-shell--menu-open" : ""}`}>
      <RosterPage
        embedded
        selectedClientSlugs={selectedCustomerSlugs}
        onSelectedClientSlugsChange={setSelectedCustomerSlugs}
      />

      <button
        type="button"
        className="dashboard-logo-fab"
        onClick={() => setShowSideMenu((v) => !v)}
        aria-label={showSideMenu ? "Close side menu" : "Open side menu"}
      >
        <img src={pabcLogo} alt="PABC logo" />
      </button>

      <aside className={`dashboard-side-menu ${showSideMenu ? "dashboard-side-menu--open" : ""}`} aria-label="Dashboard side menu">
        <div className="page dashboard-page">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Dashboard</h1>
            <Link to="/settings" className="dashboard-settings-cog" aria-label="Open settings">
              ⚙
            </Link>
            <div className="dashboard-broadcast-actions">
              <button
                type="button"
                className="dashboard-broadcast-btn"
                title={selectedCustomerNames.length > 0 ? "Send message to selected customers" : `Send message to all groups (${allRecipients.length})`}
                aria-label={selectedCustomerNames.length > 0 ? "Send message to selected customers" : "Send message to all groups"}
                onClick={sendGlobalMessage}
                disabled={selectedCustomerNames.length === 0 && allRecipients.length === 0}
              >
                ✉
              </button>
              <button
                type="button"
                className="dashboard-broadcast-btn dashboard-broadcast-btn--voice"
                title={selectedCustomerNames.length > 0 ? "Send voice note to selected customers" : `Send voice note to all groups (${allRecipients.length})`}
                aria-label={selectedCustomerNames.length > 0 ? "Send voice note to selected customers" : "Send voice note to all groups"}
                onClick={sendGlobalVoice}
                disabled={selectedCustomerNames.length === 0 && allRecipients.length === 0}
              >
                🎤
              </button>
            </div>
            <div className="dashboard-search-wrap">
              <label className="visually-hidden" htmlFor="dashboard-search">
                Global search (customers, staff)
              </label>
              <span className="dashboard-search-icon" aria-hidden>
                🔎
              </span>
              <input
                id="dashboard-search"
                type="search"
                className="dashboard-search-input"
                placeholder="Search customers, staff…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </header>
          {broadcastNotice ? (
            <p className="dashboard-broadcast-notice" role="status">
              {broadcastNotice}
            </p>
          ) : null}

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
          </div>
          {selectedCustomerNames.length > 0 ? (
            <p className="dashboard-filter-chip">
              Roster filter: <strong>{selectedCustomerNames.join(", ")}</strong>{" "}
              <button type="button" onClick={() => setSelectedCustomerSlugs([])}>
                Clear
              </button>
            </p>
          ) : null}

          {isGlobalSearch && globalMatches ? (
            <section className="dashboard-global-results" aria-label="Global search results">
              {emptyGlobal ? (
                <p className="dashboard-empty">No matches across customers or staff.</p>
              ) : (
                <>
                  {globalMatches.customers.length > 0 ? (
                    <div className="dashboard-global-block">
                      <h2 className="dashboard-global-heading">Customers</h2>
                      <ul className="dashboard-pill-list">
                        {globalMatches.customers.map((c) => (
                          <li key={c.slug}>
                            <label className="dashboard-customer-filter-row">
                              <button
                                type="button"
                                className="dashboard-pill-link dashboard-pill-link--button"
                                onClick={() => toggleCustomerFilter(c.slug)}
                              >
                                {c.name}
                              </button>
                              <input
                                type="checkbox"
                                checked={selectedCustomerSlugs.includes(c.slug)}
                                onChange={() => toggleCustomerFilter(c.slug)}
                                aria-label={`Filter roster by ${c.name}`}
                              />
                            </label>
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
                            <Link
                              to={`/staff/${s.slug}`}
                              className="dashboard-pill-link"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "pool", staffSlug: s.slug }));
                                e.dataTransfer.effectAllowed = "copyMove";
                              }}
                            >
                              {s.name}
                              <span className="dashboard-pill-meta">{s.role}</span>
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
                        <label className="dashboard-customer-filter-row">
                          <button
                            type="button"
                            className="dashboard-pill-link dashboard-pill-link--button"
                            onClick={() => toggleCustomerFilter(c.slug)}
                          >
                            {c.name}
                          </button>
                          <input
                            type="checkbox"
                            checked={selectedCustomerSlugs.includes(c.slug)}
                            onChange={() => toggleCustomerFilter(c.slug)}
                            aria-label={`Filter roster by ${c.name}`}
                          />
                        </label>
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
                        <Link
                          to={`/staff/${s.slug}`}
                          className="dashboard-pill-link"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "pool", staffSlug: s.slug }));
                            e.dataTransfer.effectAllowed = "copyMove";
                          }}
                        >
                          {s.name}
                          <span className="dashboard-pill-meta">{s.role}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
