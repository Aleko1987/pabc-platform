import { useMemo, useState } from "react";

import { personalScheduleThreeSegments, dateKeyFromParts } from "../data/rosterAssignments";
import { STAFF_RECORDS } from "../data/staffDirectory";
import { monthTitle } from "../utils/monthCalendar";

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, lines: string[]): void {
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [notice, setNotice] = useState<string | null>(null);

  const previewTotals = useMemo(() => {
    const dCount = daysInMonth(year, monthIndex);
    let rows = 0;
    let totalHours = 0;
    for (const s of STAFF_RECORDS) {
      for (let day = 1; day <= dCount; day++) {
        const dateKey = dateKeyFromParts(year, monthIndex, day);
        const segments = personalScheduleThreeSegments(s.slug, s.name, dateKey);
        for (const seg of segments) {
          if (seg.status === "work") {
            rows++;
            totalHours += 8;
          }
        }
      }
    }
    return { rows, totalHours };
  }, [year, monthIndex]);

  const bumpMonth = (delta: number) => {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  };

  const exportWorkHoursCsv = () => {
    const dCount = daysInMonth(year, monthIndex);
    const lines: string[] = [];
    lines.push(
      [
        "date",
        "staff_slug",
        "staff_name",
        "role",
        "hours_worked",
        "shift_label",
        "customer_slug",
        "customer_name",
        "site_name",
      ].join(","),
    );

    let written = 0;
    for (const s of STAFF_RECORDS) {
      for (let day = 1; day <= dCount; day++) {
        const dateKey = dateKeyFromParts(year, monthIndex, day);
        const segments = personalScheduleThreeSegments(s.slug, s.name, dateKey);
        for (const seg of segments) {
          if (seg.status !== "work") continue;
          lines.push(
            [
              csvEscape(dateKey),
              csvEscape(s.slug),
              csvEscape(s.name),
              csvEscape(s.role),
              csvEscape(8),
              csvEscape(seg.label),
              csvEscape(seg.posting.customerSlug),
              csvEscape(seg.posting.customerName),
              csvEscape(seg.posting.siteName),
            ].join(","),
          );
          written++;
        }
      }
    }

    const m = String(monthIndex + 1).padStart(2, "0");
    downloadCsv(`work-hours-${year}-${m}.csv`, lines);
    setNotice(`Exported ${written} rows for ${monthTitle(year, monthIndex)}.`);
  };

  return (
    <div className="page">
      <h1>Settings</h1>
      <p>TODO: Org profile, integrations, role management.</p>
      <section className="settings-export-card" aria-label="Exports">
        <h2 className="settings-export-title">Exports</h2>
        <p className="settings-export-lead">
          Export monthly work-hour rows for payroll reconciliation (mock schedule data).
        </p>
        <div className="settings-export-toolbar">
          <button type="button" className="settings-month-nav-btn" onClick={() => bumpMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <strong className="settings-month-label">{monthTitle(year, monthIndex)}</strong>
          <button type="button" className="settings-month-nav-btn" onClick={() => bumpMonth(1)} aria-label="Next month">
            →
          </button>
          <button type="button" className="settings-export-btn" onClick={exportWorkHoursCsv}>
            Export work hours CSV
          </button>
        </div>
        <p className="settings-export-meta">
          Preview: {previewTotals.rows} work rows · {previewTotals.totalHours} total hours
        </p>
        {notice ? <p className="settings-export-notice">{notice}</p> : null}
      </section>
    </div>
  );
}
