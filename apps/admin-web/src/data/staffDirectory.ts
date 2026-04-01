/** Staff directory (mock). Slugs used in URLs. */

export type StaffRecord = {
  slug: string;
  name: string;
  role: string;
  phone?: string;
};

export const STAFF_RECORDS: StaffRecord[] = [
  {
    slug: "thabo-mokoena",
    name: "Thabo Mokoena",
    role: "Site supervisor",
    phone: "+27 82 000 1001",
  },
  {
    slug: "nomsa-khumalo",
    name: "Nomsa Khumalo",
    role: "Security officer",
    phone: "+27 83 000 1002",
  },
  {
    slug: "david-van-der-berg",
    name: "David van der Berg",
    role: "Armed response",
    phone: "+27 84 000 1003",
  },
  {
    slug: "lerato-maseko",
    name: "Lerato Maseko",
    role: "Control room",
    phone: "+27 82 000 1004",
  },
  {
    slug: "pieter-botha",
    name: "Pieter Botha",
    role: "Security officer",
    phone: "+27 83 000 1005",
  },
  {
    slug: "zanele-dlamini",
    name: "Zanele Dlamini",
    role: "Team lead",
    phone: "+27 84 000 1006",
  },
  {
    slug: "kevin-naidoo",
    name: "Kevin Naidoo",
    role: "Patrol",
    phone: "+27 82 000 1007",
  },
  {
    slug: "ayanda-ntuli",
    name: "Ayanda Ntuli",
    role: "Security officer",
    phone: "+27 83 000 1008",
  },
  {
    slug: "michelle-fourie",
    name: "Michelle Fourie",
    role: "Site supervisor",
    phone: "+27 84 000 1009",
  },
];

const bySlug = new Map(STAFF_RECORDS.map((s) => [s.slug, s]));
const byNameLower = new Map(STAFF_RECORDS.map((s) => [s.name.trim().toLowerCase(), s]));

export function getStaffBySlug(slug: string): StaffRecord | undefined {
  return bySlug.get(slug);
}

/** Resolve dashboard / customer guard strings to staff rows (exact name match). */
export function getStaffByName(displayName: string): StaffRecord | undefined {
  return byNameLower.get(displayName.trim().toLowerCase());
}
