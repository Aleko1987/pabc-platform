import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { RosterDeploymentMap } from "../components/RosterDeploymentMap";
import { CUSTOMER_RECORDS } from "../data/customers";
import {
  buildAssignmentsForDay,
  type DayPosting,
  dateKeyFromParts,
  getEligiblePostingsForStaffName,
  getStaffSlugsForCustomer,
  postingForDay,
} from "../data/rosterAssignments";
import { getStaffBySlug, STAFF_RECORDS } from "../data/staffDirectory";
import { calendarGrid, monthTitle, WEEKDAYS } from "../utils/monthCalendar";

const DND_MIME = "application/x-pabc-roster";
const STORAGE_KEY = "pabc-admin-roster-placements-v1";

type RosterAssignment = DayPosting & {
  assignmentId: string;
};

type DragPayload =
  | { kind: "pool"; staffSlug: string }
  | { kind: "calendar"; assignmentId: string; fromDateKey: string };

export function RosterPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [clientSearch, setClientSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  /** `null` = all clients (full calendar + full map). */
  const [filterClientSlug, setFilterClientSlug] = useState<string | null>(null);
  const [assignmentsByDay, setAssignmentsByDay] = useState<Record<string, RosterAssignment[]>>(() =>
    loadAssignments(today.getFullYear(), today.getMonth()),
  );

  const grid = useMemo(() => calendarGrid(year, monthIndex), [year, monthIndex]);
  const monthDateKeys = useMemo(
    () =>
      grid
        .filter((d): d is number => d != null)
        .map((day) => dateKeyFromParts(year, monthIndex, day)),
    [grid, monthIndex, year],
  );

  useEffect(() => {
    setAssignmentsByDay((prev) => {
      const next = { ...prev };
      for (const key of monthDateKeys) {
        if (!next[key]) {
          next[key] = buildAssignmentsForDay(key).map((p) => withAssignmentId(p, key));
        }
      }
      return next;
    });
  }, [monthDateKeys]);

  useEffect(() => {
    saveAssignments(assignmentsByDay);
  }, [assignmentsByDay]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return CUSTOMER_RECORDS;
    return CUSTOMER_RECORDS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [clientSearch]);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return STAFF_RECORDS;
    return STAFF_RECORDS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    );
  }, [staffSearch]);

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

  const readDragPayload = (e: React.DragEvent): DragPayload | null => {
    const raw = e.dataTransfer.getData(DND_MIME);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.kind === "pool" && typeof parsed.staffSlug === "string") {
        return { kind: "pool", staffSlug: parsed.staffSlug };
      }
      if (
        parsed &&
        parsed.kind === "calendar" &&
        typeof parsed.assignmentId === "string" &&
        typeof parsed.fromDateKey === "string"
      ) {
        return { kind: "calendar", assignmentId: parsed.assignmentId, fromDateKey: parsed.fromDateKey };
      }
    } catch {
      return null;
    }
    return null;
  };

  const onDropDate = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    setDragOverDateKey(null);
    const payload = readDragPayload(e);
    if (!payload) return;

    setAssignmentsByDay((prev) => {
      const next = { ...prev };
      const targetList = [...(next[targetDateKey] ?? [])];

      if (payload.kind === "pool") {
        const posting = createPostingForDrop(payload.staffSlug, targetDateKey, filterClientSlug, targetList);
        if (!posting) return prev;
        next[targetDateKey] = [...targetList, posting];
        return next;
      }

      if (payload.fromDateKey === targetDateKey) return prev;
      const sourceList = [...(next[payload.fromDateKey] ?? [])];
      const movedPosting = sourceList.find((p) => p.assignmentId === payload.assignmentId);
      if (!movedPosting) return prev;

      next[payload.fromDateKey] = sourceList.filter((p) => p.assignmentId !== payload.assignmentId);
      next[targetDateKey] = [...targetList, movedPosting];
      return next;
    });
  };

  const removeAssignment = (dateKey: string, assignmentId: string) => {
    setAssignmentsByDay((prev) => {
      const day = prev[dateKey];
      if (!day) return prev;
      return {
        ...prev,
        [dateKey]: day.filter((p) => p.assignmentId !== assignmentId),
      };
    });
  };

  const resetVisibleMonth = () => {
    setAssignmentsByDay((prev) => {
      const next = { ...prev };
      for (const key of monthDateKeys) {
        next[key] = buildAssignmentsForDay(key).map((p) => withAssignmentId(p, key));
      }
      return next;
    });
  };

  const clearSavedRoster = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setAssignmentsByDay(buildMonthAssignments(year, monthIndex));
  };

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
          <div className="roster-cal-toolbar">
            <button type="button" className="roster-cal-tool-btn" onClick={resetVisibleMonth}>
              Reset month
            </button>
            <button type="button" className="roster-cal-tool-btn roster-cal-tool-btn--danger" onClick={clearSavedRoster}>
              Clear saved roster
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
              const dayAssignments = assignmentsByDay[dateKey] ?? [];
              const postings =
                filterClientSlug == null
                  ? dayAssignments
                  : dayAssignments.filter((p) => p.customerSlug === filterClientSlug);

              return (
                <div
                  key={dateKey}
                  className={`roster-cal-cell ${dragOverDateKey === dateKey ? "roster-cal-cell--dragover" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDateKey(dateKey);
                  }}
                  onDragLeave={() => setDragOverDateKey((prev) => (prev === dateKey ? null : prev))}
                  onDrop={(e) => onDropDate(e, dateKey)}
                >
                  <div className="roster-cal-daynum">{day}</div>
                  <ul className="roster-cal-list">
                    {postings.map((p) => (
                      <li
                        key={p.assignmentId}
                        className="roster-cal-item roster-cal-item--card"
                        title={`${p.staffName} → ${p.customerName} · ${p.siteName}`}
                        draggable
                        onDragStart={(e) => {
                          const payload: DragPayload = {
                            kind: "calendar",
                            assignmentId: p.assignmentId,
                            fromDateKey: dateKey,
                          };
                          e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="roster-cal-card-head">
                          <Link to={`/staff/${p.staffSlug}`} className="roster-cal-name">
                            {p.staffName}
                          </Link>
                        </div>
                        {filterClientSlug == null ? (
                          <span className="roster-cal-meta">{truncate(p.customerName, 22)}</span>
                        ) : (
                          <span className="roster-cal-meta">{p.siteName}</span>
                        )}
                        <button
                          type="button"
                          className="roster-cal-remove"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeAssignment(dateKey, p.assignmentId);
                          }}
                          aria-label={`Remove ${p.staffName} from day ${day}`}
                          title="Remove placement"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                    {postings.length === 0 ? <li className="roster-cal-empty-hint">Drop staff card here</li> : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="roster-staff-panel" aria-label="Staff placement menu">
          <div className="roster-sidebar-block">
            <h2 className="roster-sidebar-heading">Staff placement</h2>
            <p className="roster-sidebar-hint">
              Drag staff cards onto any day. Drag cards between days to move placements.
            </p>
          </div>
          <div className="roster-sidebar-block">
            <label className="roster-search-label" htmlFor="roster-staff-search">
              Search staff
            </label>
            <input
              id="roster-staff-search"
              type="search"
              className="roster-search-input"
              placeholder="Filter by name or role…"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <ul className="roster-staff-list">
            {filteredStaff.map((staff) => (
              <li
                key={staff.slug}
                className="roster-staff-card"
                draggable
                onDragStart={(e) => {
                  const payload: DragPayload = { kind: "pool", staffSlug: staff.slug };
                  e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
                  e.dataTransfer.effectAllowed = "copyMove";
                }}
                title={`Drag ${staff.name} onto calendar`}
              >
                <strong>{staff.name}</strong>
                <span>{staff.role}</span>
              </li>
            ))}
            {filteredStaff.length === 0 ? <li className="roster-client-empty">No staff match this search.</li> : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function buildMonthAssignments(year: number, monthIndex: number): Record<string, RosterAssignment[]> {
  const out: Record<string, RosterAssignment[]> = {};
  for (const day of calendarGrid(year, monthIndex)) {
    if (day == null) continue;
    const dateKey = dateKeyFromParts(year, monthIndex, day);
    out[dateKey] = buildAssignmentsForDay(dateKey).map((p) => withAssignmentId(p, dateKey));
  }
  return out;
}

function createPostingForDrop(
  staffSlug: string,
  dateKey: string,
  preferredClientSlug: string | null,
  targetList: RosterAssignment[],
): RosterAssignment | null {
  const staff = getStaffBySlug(staffSlug);
  if (!staff) return null;

  const eligible = getEligiblePostingsForStaffName(staff.name);
  if (eligible.length === 0) return withAssignmentId(postingForDay(staffSlug, staff.name, dateKey), dateKey);

  const sameStaffCount = targetList.filter((p) => p.staffSlug === staffSlug).length;

  if (preferredClientSlug != null) {
    const preferred = eligible.filter((p) => p.customerSlug === preferredClientSlug);
    const match = preferred[sameStaffCount % preferred.length] ?? null;
    if (match) {
      return withAssignmentId(
        {
          staffSlug,
          staffName: staff.name,
          customerSlug: match.customerSlug,
          customerName: match.customerName,
          siteName: match.siteName,
        },
        dateKey,
      );
    }
  }

  const rotated = eligible[sameStaffCount % eligible.length];
  return withAssignmentId(
    {
      staffSlug,
      staffName: staff.name,
      customerSlug: rotated.customerSlug,
      customerName: rotated.customerName,
      siteName: rotated.siteName,
    },
    dateKey,
  );
}

function withAssignmentId(posting: DayPosting, dateKey: string): RosterAssignment {
  return {
    ...posting,
    assignmentId: makeAssignmentId(dateKey, posting.staffSlug),
  };
}

function makeAssignmentId(dateKey: string, staffSlug: string): string {
  return `${dateKey}__${staffSlug}__${Math.random().toString(36).slice(2, 9)}`;
}

function saveAssignments(assignmentsByDay: Record<string, RosterAssignment[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignmentsByDay));
  } catch {
    // Ignore persistence failures (private mode, quota, etc.).
  }
}

function loadAssignments(year: number, monthIndex: number): Record<string, RosterAssignment[]> {
  if (typeof window === "undefined") return buildMonthAssignments(year, monthIndex);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildMonthAssignments(year, monthIndex);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return buildMonthAssignments(year, monthIndex);

    const out: Record<string, RosterAssignment[]> = {};
    for (const [dateKey, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;
      out[dateKey] = value
        .filter(isRosterAssignmentLike)
        .map((p) => ({
          ...p,
          assignmentId: p.assignmentId || makeAssignmentId(dateKey, p.staffSlug),
        }));
    }
    return out;
  } catch {
    return buildMonthAssignments(year, monthIndex);
  }
}

function isRosterAssignmentLike(value: unknown): value is RosterAssignment {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<RosterAssignment>;
  return (
    typeof v.staffSlug === "string" &&
    typeof v.staffName === "string" &&
    typeof v.customerSlug === "string" &&
    typeof v.customerName === "string" &&
    typeof v.siteName === "string" &&
    (typeof v.assignmentId === "string" || v.assignmentId == null)
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
