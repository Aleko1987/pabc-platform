import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  dateKeyFromParts,
  getSitesAndColleaguesForStaff,
  personalScheduleThreeSegments,
} from "../data/rosterAssignments";
import { getStaffBySlug } from "../data/staffDirectory";
import "../styles/staff-schedule.css";
import { calendarGrid, monthTitle, WEEKDAYS } from "../utils/monthCalendar";

export function StaffSchedulePage() {
  const { staffSlug } = useParams<{ staffSlug: string }>();
  const staff = staffSlug ? getStaffBySlug(staffSlug) : undefined;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  const grid = useMemo(() => calendarGrid(year, monthIndex), [year, monthIndex]);

  const siteGroups = useMemo(
    () => (staff ? getSitesAndColleaguesForStaff(staff.name) : []),
    [staff],
  );

  const bumpMonth = (delta: number) => {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  };

  const sendStaffMessage = () => {
    if (!staff) return;
    const body = window.prompt(`Message to ${staff.name}:`, "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to ${staff.name}.`);
  };

  const sendStaffVoice = () => {
    if (!staff) return;
    const note = window.prompt(`Voice note label for ${staff.name}:`, "Shift handover briefing");
    if (!note || !note.trim()) return;
    setBroadcastNotice(`Voice note sent to ${staff.name}.`);
  };

  if (!staff) {
    return (
      <div className="page">
        <h1>Staff not found</h1>
        <p className="page-lead">No profile matches this link.</p>
        <Link to="/dashboard" className="text-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="page staff-schedule-page">
      <Link to={`/staff/${staff.slug}`} className="text-link staff-schedule-back">
        ← {staff.name}
      </Link>

      <header className="staff-schedule-header">
        <div className="dashboard-header">
          <h1>My schedule</h1>
          <div className="dashboard-broadcast-actions">
            <button
              type="button"
              className="dashboard-broadcast-btn"
              title={`Send message to ${staff.name}`}
              aria-label={`Send message to ${staff.name}`}
              onClick={sendStaffMessage}
            >
              ✉
            </button>
            <button
              type="button"
              className="dashboard-broadcast-btn dashboard-broadcast-btn--voice"
              title={`Send voice note to ${staff.name}`}
              aria-label={`Send voice note to ${staff.name}`}
              onClick={sendStaffVoice}
            >
              🎤
            </button>
          </div>
        </div>
        {broadcastNotice ? (
          <p className="dashboard-broadcast-notice" role="status">
            {broadcastNotice}
          </p>
        ) : null}
        <p className="page-lead">
          <strong>{staff.name}</strong> — mock roster is <strong>five shifts per week</strong>: one day shift (08:00–16:00)
          Monday–Friday; nights and evenings are off; weekends off. The three rows show each time band. Below: who else
          is at your sites for handovers.
        </p>
      </header>

      <section className="staff-schedule-cal-section" aria-label="Personal monthly calendar">
        <div className="staff-schedule-nav">
          <button type="button" className="staff-schedule-nav-btn" onClick={() => bumpMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <h2 className="staff-schedule-month-title">{monthTitle(year, monthIndex)}</h2>
          <button type="button" className="staff-schedule-nav-btn" onClick={() => bumpMonth(1)} aria-label="Next month">
            →
          </button>
        </div>

        <div className="staff-schedule-grid" role="grid">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="staff-schedule-weekday" role="columnheader">
              {wd}
            </div>
          ))}
          {grid.map((day, i) => {
            if (day === null) {
              return <div key={`pad-${i}`} className="staff-schedule-cell staff-schedule-cell--empty" />;
            }
            const dateKey = dateKeyFromParts(year, monthIndex, day);
            const segments = personalScheduleThreeSegments(staff.slug, staff.name, dateKey);

            return (
              <div key={dateKey} className="staff-schedule-cell">
                <div className="staff-schedule-daynum">{day}</div>
                <div className="staff-schedule-shifts">
                  {segments.map((seg, shiftIndex) => (
                    <div
                      key={`${dateKey}-${shiftIndex}`}
                      className={`staff-schedule-shift ${seg.status === "off" ? "staff-schedule-shift--off" : ""}`}
                      title={
                        seg.status === "off"
                          ? `${seg.label} · Off`
                          : `${seg.label} · ${seg.posting.customerName} · ${seg.posting.siteName}`
                      }
                    >
                      <div className="staff-schedule-shift-label">{seg.label}</div>
                      {seg.status === "off" ? (
                        <div className="staff-schedule-shift-body staff-schedule-shift-body--off">
                          <span className="staff-schedule-off">Off</span>
                        </div>
                      ) : (
                        <div className="staff-schedule-shift-body">
                          <span className="staff-schedule-client">{seg.posting.customerName}</span>
                          <span className="staff-schedule-site">{seg.posting.siteName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="staff-schedule-colleagues" aria-label="Colleagues at your sites">
        <h2 className="staff-schedule-colleagues-title">Who is at your company &amp; sites</h2>
        <p className="staff-schedule-colleagues-lead">
          Other officers on the same client roster — use this to coordinate shift changes and handovers.
        </p>

        {siteGroups.length === 0 ? (
          <p className="staff-schedule-empty">No customer sites linked to this profile yet.</p>
        ) : (
          <ul className="staff-schedule-site-list">
            {siteGroups.map((g) => (
              <li key={`${g.customerSlug}-${g.siteName}`} className="staff-schedule-site-card">
                <div className="staff-schedule-site-head">
                  <Link to={`/customers/${g.customerSlug}`} className="staff-schedule-customer-link">
                    {g.customerName}
                  </Link>
                  <span className="staff-schedule-site-pill">{g.siteName}</span>
                </div>
                {g.colleagues.length === 0 ? (
                  <p className="staff-schedule-solo">No other guards listed at this site on the roster.</p>
                ) : (
                  <ul className="staff-schedule-peer-list">
                    {g.colleagues.map((c) => (
                      <li key={c.slug}>
                        <Link to={`/staff/${c.slug}`} className="staff-schedule-peer-link">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
