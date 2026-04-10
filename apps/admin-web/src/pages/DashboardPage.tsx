import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { CUSTOMER_RECORDS } from "../data/customers";
import { RosterPage } from "./RosterPage";
import { STAFF_RECORDS } from "../data/staffDirectory";

type Tab = "customers" | "staff";

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
  const [showRosterPopup, setShowRosterPopup] = useState(false);
  const searchQuery = query.trim();
  const globalMatches = useGlobalMatches(searchQuery);
  const isGlobalSearch = searchQuery.length > 0;

  const allRecipients = useMemo(() => {
    const names = CUSTOMER_RECORDS.flatMap((c) => c.sites.flatMap((s) => s.guards));
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, []);

  const sendGlobalMessage = () => {
    if (allRecipients.length === 0) return;
    const body = window.prompt("Message to send to all groups:", "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to all groups (${allRecipients.length} recipients).`);
  };

  const sendGlobalVoice = () => {
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
    <div className="page dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-broadcast-actions">
          <button
            type="button"
            className="dashboard-broadcast-btn"
            title={`Send message to all groups (${allRecipients.length})`}
            aria-label="Send message to all groups"
            onClick={sendGlobalMessage}
            disabled={allRecipients.length === 0}
          >
            ✉
          </button>
          <button
            type="button"
            className="dashboard-broadcast-btn dashboard-broadcast-btn--voice"
            title={`Send voice note to all groups (${allRecipients.length})`}
            aria-label="Send voice note to all groups"
            onClick={sendGlobalVoice}
            disabled={allRecipients.length === 0}
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
        </div>
      )}

      <button
        type="button"
        className="dashboard-roster-fab"
        onClick={() => setShowRosterPopup(true)}
        aria-label="Open roster calendar pop-up"
      >
        Roster
      </button>

      {showRosterPopup ? (
        <div className="dashboard-roster-overlay" role="dialog" aria-modal="true" aria-label="Roster calendar">
          <div className="dashboard-roster-sheet">
            <div className="dashboard-roster-sheet-head">
              <h2>Roster calendar</h2>
              <button
                type="button"
                className="dashboard-roster-close"
                onClick={() => setShowRosterPopup(false)}
                aria-label="Close roster calendar pop-up"
              >
                ×
              </button>
            </div>
            <RosterPage embedded />
          </div>
          <button
            type="button"
            className="dashboard-roster-overlay-dismiss"
            onClick={() => setShowRosterPopup(false)}
            aria-label="Close roster calendar"
          />
        </div>
      ) : null}
    </div>
  );
}
