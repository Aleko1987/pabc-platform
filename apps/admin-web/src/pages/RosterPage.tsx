import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { RosterDeploymentMap } from "../components/RosterDeploymentMap";
import { CUSTOMER_RECORDS } from "../data/customers";
import {
  buildAssignmentsForDay,
  dateKeyFromParts,
  filterPostingsForClient,
  getStaffSlugsForCustomer,
} from "../data/rosterAssignments";
import { STAFF_RECORDS } from "../data/staffDirectory";
import { calendarGrid, monthTitle, WEEKDAYS } from "../utils/monthCalendar";

export function RosterPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [clientSearch, setClientSearch] = useState("");
  /** `null` = all clients (full calendar + full map). */
  const [filterClientSlug, setFilterClientSlug] = useState<string | null>(null);

  const grid = useMemo(() => calendarGrid(year, monthIndex), [year, monthIndex]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return CUSTOMER_RECORDS;
    return CUSTOMER_RECORDS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [clientSearch]);

  const mapSlugs = useMemo(() => {
    if (filterClientSlug == null) return null;
    return new Set(getStaffSlugsForCustomer(filterClientSlug));
  }, [filterClientSlug]);

  const bumpMonth = (delta: number) => {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  };

  const selectedClientName =
    filterClientSlug == null ? null : CUSTOMER_RECORDS.find((c) => c.slug === filterClientSlug)?.name ?? null;

  return (
    <div className="page roster-page roster-page--wide">
      <Link to="/dashboard" className="text-link roster-back">
        ← Dashboard
      </Link>

      <header className="roster-header">
        <h1>Roster</h1>
        <p className="page-lead">
          Monthly deployment calendar. Mock assignments rotate per day from each officer’s eligible sites. Select all
          clients to see everyone on the map; search and pick one client to focus the grid.
        </p>
      </header>

      <div className="roster-layout">
        <aside className="roster-sidebar" aria-label="Client filters and map">
          <div className="roster-sidebar-block">
            <label className="roster-checkbox-label">
              <input
                type="checkbox"
                checked={filterClientSlug === null}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterClientSlug(null);
                  } else {
                    setFilterClientSlug(
                      filteredClients[0]?.slug ?? CUSTOMER_RECORDS[0]?.slug ?? null,
                    );
                  }
                }}
              />
              <span>Select all clients</span>
            </label>
            <p className="roster-sidebar-hint">Shows every posting in the calendar and all officers on the deployment map.</p>
          </div>

          <div className="roster-sidebar-block">
            <label className="roster-search-label" htmlFor="roster-client-search">
              Search clients
            </label>
            <input
              id="roster-client-search"
              type="search"
              className="roster-search-input"
              placeholder="Filter by name…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <ul className="roster-client-list">
            {filteredClients.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className={`roster-client-btn ${filterClientSlug === c.slug ? "roster-client-btn--active" : ""}`}
                  onClick={() => setFilterClientSlug(c.slug)}
                >
                  {c.name}
                </button>
              </li>
            ))}
            {filteredClients.length === 0 ? (
              <li className="roster-client-empty">No clients match this search.</li>
            ) : null}
          </ul>

          <div className="roster-sidebar-block roster-map-block">
            <h2 className="roster-sidebar-heading">Deployment map</h2>
            <p className="roster-sidebar-hint">
              {filterClientSlug == null
                ? "All officers (mock positions)."
                : selectedClientName
                  ? `Guards assigned to ${selectedClientName}.`
                  : null}
            </p>
            <RosterDeploymentMap visibleSlugs={mapSlugs} allStaff={STAFF_RECORDS} />
            <Link to="/dashboard" className="roster-link-customers">
              Open dashboard → customers
            </Link>
          </div>
        </aside>

        <section className="roster-calendar-section" aria-label="Monthly roster">
          <div className="roster-cal-nav">
            <button type="button" className="roster-cal-nav-btn" onClick={() => bumpMonth(-1)} aria-label="Previous month">
              ←
            </button>
            <h2 className="roster-cal-title">{monthTitle(year, monthIndex)}</h2>
            <button type="button" className="roster-cal-nav-btn" onClick={() => bumpMonth(1)} aria-label="Next month">
              →
            </button>
          </div>

          {filterClientSlug != null ? (
            <p className="roster-cal-filter-banner">
              Showing: <strong>{selectedClientName}</strong> ·{" "}
              <button type="button" className="roster-clear-filter" onClick={() => setFilterClientSlug(null)}>
                Clear and show all clients
              </button>
            </p>
          ) : null}

          <div className="roster-cal-grid" role="grid" aria-label={`Calendar ${monthTitle(year, monthIndex)}`}>
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="roster-cal-weekday" role="columnheader">
                {wd}
              </div>
            ))}
            {grid.map((day, i) => {
              if (day === null) {
                return <div key={`pad-${i}`} className="roster-cal-cell roster-cal-cell--empty" />;
              }
              const dateKey = dateKeyFromParts(year, monthIndex, day);
              const postings = filterPostingsForClient(buildAssignmentsForDay(dateKey), filterClientSlug);

              return (
                <div key={dateKey} className="roster-cal-cell">
                  <div className="roster-cal-daynum">{day}</div>
                  <ul className="roster-cal-list">
                    {postings.map((p) => (
                      <li
                        key={`${p.staffSlug}-${dateKey}`}
                        className="roster-cal-item"
                        title={`${p.staffName} → ${p.customerName} · ${p.siteName}`}
                      >
                        <Link to={`/staff/${p.staffSlug}`} className="roster-cal-name">
                          {p.staffName}
                        </Link>
                        {filterClientSlug == null ? (
                          <span className="roster-cal-meta"> · {truncate(p.customerName, 22)}</span>
                        ) : (
                          <span className="roster-cal-meta"> · {p.siteName}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
