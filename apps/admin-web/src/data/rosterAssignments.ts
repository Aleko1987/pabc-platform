import { CUSTOMER_RECORDS, getCustomerBySlug } from "./customers";
import { getStaffByName, STAFF_RECORDS } from "./staffDirectory";

export type SiteColleagueGroup = {
  customerSlug: string;
  customerName: string;
  siteName: string;
  colleagues: Array<{ slug: string; name: string }>;
};

/** Sites this officer covers, with other guards on the same site (shift overlap / handover). */
export function getSitesAndColleaguesForStaff(staffName: string): SiteColleagueGroup[] {
  const groups: SiteColleagueGroup[] = [];
  for (const c of CUSTOMER_RECORDS) {
    for (const site of c.sites) {
      if (!site.guards.includes(staffName)) continue;
      const colleagues = site.guards
        .filter((g) => g !== staffName)
        .map((name) => {
          const rec = getStaffByName(name);
          return rec ? { slug: rec.slug, name: rec.name } : null;
        })
        .filter((x): x is { slug: string; name: string } => x != null);
      groups.push({
        customerSlug: c.slug,
        customerName: c.name,
        siteName: site.siteName,
        colleagues,
      });
    }
  }
  return groups;
}

export type DayPosting = {
  staffSlug: string;
  staffName: string;
  customerSlug: string;
  customerName: string;
  siteName: string;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getEligiblePostingsForStaffName(name: string): Array<{
  customerSlug: string;
  customerName: string;
  siteName: string;
}> {
  const out: Array<{ customerSlug: string; customerName: string; siteName: string }> = [];
  for (const c of CUSTOMER_RECORDS) {
    for (const site of c.sites) {
      if (site.guards.includes(name)) {
        out.push({ customerSlug: c.slug, customerName: c.name, siteName: site.siteName });
      }
    }
  }
  return out;
}

/** Three roster blocks per calendar day (personal schedule). */
export const SCHEDULE_SHIFT_LABELS = ["00:00–08:00", "08:00–16:00", "16:00–00:00"] as const;

export function postingForDay(staffSlug: string, staffName: string, dateKey: string): DayPosting {
  const eligible = getEligiblePostingsForStaffName(staffName);
  if (eligible.length === 0) {
    return {
      staffSlug,
      staffName,
      customerSlug: "unassigned",
      customerName: "Unassigned",
      siteName: "—",
    };
  }
  const i = hashString(dateKey + staffSlug) % eligible.length;
  const p = eligible[i];
  return { staffSlug, staffName, ...p };
}

/** One posting per 8-hour block; index 0 = night, 1 = day, 2 = evening. */
export function postingForShift(
  staffSlug: string,
  staffName: string,
  dateKey: string,
  shiftIndex: 0 | 1 | 2,
): DayPosting {
  const eligible = getEligiblePostingsForStaffName(staffName);
  if (eligible.length === 0) {
    return {
      staffSlug,
      staffName,
      customerSlug: "unassigned",
      customerName: "Unassigned",
      siteName: "—",
    };
  }
  const i = hashString(`${dateKey}:${staffSlug}:shift${shiftIndex}`) % eligible.length;
  const p = eligible[i];
  return { staffSlug, staffName, ...p };
}

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** One row in the personal schedule grid (three per day). */
export type PersonalScheduleSegment =
  | { label: string; status: "off" }
  | { label: string; status: "work"; posting: DayPosting };

/**
 * Personal schedule: **5 shifts per week** — one day shift (08:00–16:00) Mon–Fri only.
 * Nights, evenings, and all weekend segments are off (no 24/7 coverage in mock data).
 */
export function personalScheduleThreeSegments(
  staffSlug: string,
  staffName: string,
  dateKey: string,
): PersonalScheduleSegment[] {
  const labels = SCHEDULE_SHIFT_LABELS;
  const d = parseLocalDateKey(dateKey);
  const dow = d.getDay();
  const isWeekend = dow === 0 || dow === 6;

  if (isWeekend) {
    return [
      { label: labels[0], status: "off" },
      { label: labels[1], status: "off" },
      { label: labels[2], status: "off" },
    ];
  }

  const dayShift = postingForShift(staffSlug, staffName, dateKey, 1);
  return [
    { label: labels[0], status: "off" },
    { label: labels[1], status: "work", posting: dayShift },
    { label: labels[2], status: "off" },
  ];
}

export function buildAssignmentsForDay(dateKey: string): DayPosting[] {
  return STAFF_RECORDS.map((s) => postingForDay(s.slug, s.name, dateKey));
}

export function dateKeyFromParts(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Staff slugs that guard any site under this customer (for map + filters). */
export function getStaffSlugsForCustomer(customerSlug: string): string[] {
  const c = getCustomerBySlug(customerSlug);
  if (!c) return [];
  const names = new Set<string>();
  for (const s of c.sites) {
    for (const g of s.guards) names.add(g);
  }
  const slugs: string[] = [];
  for (const name of names) {
    const rec = getStaffByName(name);
    if (rec) slugs.push(rec.slug);
  }
  return slugs;
}

export function filterPostingsForClient(postings: DayPosting[], clientSlug: string | null): DayPosting[] {
  if (!clientSlug) return postings;
  return postings.filter((p) => p.customerSlug === clientSlug);
}
