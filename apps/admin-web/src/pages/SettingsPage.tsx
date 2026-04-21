import { useMemo, useState } from "react";

import { ALL_AREAS_FLAT } from "../data/areas";
import { CUSTOMER_RECORDS } from "../data/customers";
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

type ExportScope = "all" | "area" | "company" | "individual";

type SettingsPageProps = {
  compact?: boolean;
  onBack?: () => void;
};

export function SettingsPage({ compact = false, onBack }: SettingsPageProps = {}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [scope, setScope] = useState<ExportScope>("all");
  const [areaSlug, setAreaSlug] = useState(ALL_AREAS_FLAT[0]?.slug ?? "");
  const [companySlug, setCompanySlug] = useState(CUSTOMER_RECORDS[0]?.slug ?? "");
  const [staffSlug, setStaffSlug] = useState(STAFF_RECORDS[0]?.slug ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const selectedCompany = useMemo(
    () => CUSTOMER_RECORDS.find((c) => c.slug === companySlug),
    [companySlug],
  );

  const includeRow = useMemo(() => {
    return (staffRowSlug: string, customerRowSlug: string): boolean => {
      switch (scope) {
        case "area":
          return CUSTOMER_RECORDS.some(
            (c) => c.slug === customerRowSlug && c.areaSlugs.includes(areaSlug),
          );
        case "company":
          return customerRowSlug === companySlug;
        case "individual":
          return staffRowSlug === staffSlug;
        case "all":
        default:
          return true;
      }
    };
  }, [scope, areaSlug, companySlug, staffSlug]);

  const scopeLabel = useMemo(() => {
    if (scope === "area") {
      return ALL_AREAS_FLAT.find((a) => a.slug === areaSlug)?.label ?? "Area";
    }
    if (scope === "company") {
      return selectedCompany?.name ?? "Company";
    }
    if (scope === "individual") {
      return STAFF_RECORDS.find((s) => s.slug === staffSlug)?.name ?? "Individual";
    }
    return "All";
  }, [scope, areaSlug, selectedCompany, staffSlug]);

  const previewTotals = useMemo(() => {
    const dCount = daysInMonth(year, monthIndex);
    let rows = 0;
    let totalHours = 0;
    for (const s of STAFF_RECORDS) {
      for (let day = 1; day <= dCount; day++) {
        const dateKey = dateKeyFromParts(year, monthIndex, day);
        const segments = personalScheduleThreeSegments(s.slug, s.name, dateKey);
        for (const seg of segments) {
          if (
            seg.status === "work" &&
            includeRow(s.slug, seg.posting.customerSlug)
          ) {
            rows++;
            totalHours += 8;
          }
        }
      }
    }
    return { rows, totalHours };
  }, [year, monthIndex, includeRow]);

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
          if (!includeRow(s.slug, seg.posting.customerSlug)) continue;
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
    const scopePart =
      scope === "all"
        ? "all"
        : scope === "area"
          ? `area-${areaSlug}`
          : scope === "company"
            ? `company-${companySlug}`
            : `individual-${staffSlug}`;
    downloadCsv(`work-hours-${year}-${m}-${scopePart}.csv`, lines);
    setNotice(
      `Exported ${written} rows for ${monthTitle(year, monthIndex)} (${scopeLabel}).`,
    );
  };

  return (
    <div className={`page settings-page ${compact ? "settings-page--compact" : ""}`}>
      <header className="settings-page-head">
        {compact ? (
          <div className="settings-page-compact-title-row">
            <h1>Settings</h1>
            {onBack ? (
              <button
                type="button"
                className="settings-inline-back"
                onClick={onBack}
                aria-label="Back to dashboard menu"
              >
                ←
              </button>
            ) : null}
          </div>
        ) : (
          <h1>Settings</h1>
        )}
        <p>TODO: Org profile, integrations, role management.</p>
      </header>
      <section className="settings-export-card" aria-label="Exports">
        <h2 className="settings-export-title">Exports</h2>
        <p className="settings-export-lead">
          Export monthly work-hour rows for payroll reconciliation (mock schedule data).
        </p>
        <div className="settings-export-filters">
          <div className="settings-filter-block">
            <label className="settings-filter-label" htmlFor="settings-export-scope">
              Export scope
            </label>
            <select
              id="settings-export-scope"
              className="settings-filter-select"
              value={scope}
              onChange={(e) => setScope(e.target.value as ExportScope)}
            >
              <option value="all">All</option>
              <option value="area">By area</option>
              <option value="company">By company name</option>
              <option value="individual">By individual</option>
            </select>
          </div>
          {scope === "area" ? (
            <div className="settings-filter-block">
              <label className="settings-filter-label" htmlFor="settings-export-area">
                Area
              </label>
              <select
                id="settings-export-area"
                className="settings-filter-select"
                value={areaSlug}
                onChange={(e) => setAreaSlug(e.target.value)}
              >
                {ALL_AREAS_FLAT.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {scope === "company" ? (
            <div className="settings-filter-block">
              <label className="settings-filter-label" htmlFor="settings-export-company">
                Company name
              </label>
              <select
                id="settings-export-company"
                className="settings-filter-select"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
              >
                {CUSTOMER_RECORDS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {scope === "individual" ? (
            <div className="settings-filter-block">
              <label className="settings-filter-label" htmlFor="settings-export-individual">
                Individual
              </label>
              <select
                id="settings-export-individual"
                className="settings-filter-select"
                value={staffSlug}
                onChange={(e) => setStaffSlug(e.target.value)}
              >
                {STAFF_RECORDS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="settings-export-toolbar">
          <button
            type="button"
            className="settings-month-nav-btn"
            onClick={() => bumpMonth(-1)}
            aria-label="Previous month"
          >
            ←
          </button>
          <strong className="settings-month-label">{monthTitle(year, monthIndex)}</strong>
          <button
            type="button"
            className="settings-month-nav-btn"
            onClick={() => bumpMonth(1)}
            aria-label="Next month"
          >
            →
          </button>
          <button type="button" className="settings-export-btn" onClick={exportWorkHoursCsv}>
            Export work hours CSV
          </button>
        </div>
        <p className="settings-export-meta">
          Scope: {scopeLabel} · Preview: {previewTotals.rows} work rows · {previewTotals.totalHours} total hours
        </p>
        {notice ? <p className="settings-export-notice">{notice}</p> : null}
      </section>
    </div>
  );
}
